import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Merchant } from "@ebazdev/customer";
import { IntegrationCustomerIds } from "../shared/models/integration-customer-ids";
import { Product } from "@ebazdev/product";
import { ColaMrechantProductsPublisher } from "../events/publisher/cola-merchant-product-updated-publisher";
import { BaseAPIClient } from "../shared/utils/cola-api-client";
import { natsWrapper } from "../nats-wrapper";

const router = express.Router();
const colaClient = new BaseAPIClient();
interface RegisteredProduct {
  productId: string;
  thirdPartyId: string | null;
}

router.get("/merchant/product-list", async (req: Request, res: Response) => {
  try {
    const holdingKey = "MCSCC";
    const tsId = { $exists: true };

    const merchants = await Merchant.find({
      type: "merchant",
      tradeShops: {
        $elemMatch: { holdingKey: holdingKey, tsId: tsId },
      },
    });

    if (!merchants.length) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ message: "No merchants found." });
    }

    const products = await Product.find({
      customerId: IntegrationCustomerIds.cocaCola,
    }).lean();

    const registeredProducts: RegisteredProduct[] = products.map((product) => ({
      productId: product._id.toString(),
      thirdPartyId:
        product.thirdPartyData?.find((data: any) =>
          data.customerId.equals(IntegrationCustomerIds.cocaCola)
        )?.productId || null,
    }));

    let activeProductList: string[] = [];
    let inActiveProductList: string[] = [];

    for (const merchant of merchants) {
      if (!merchant.tradeShops) {
        console.error(`No trade shops found for merchant: ${merchant.id}`);
        continue;
      }

      const tradeShop = merchant.tradeShops.find(
        (shop) => shop.holdingKey === holdingKey
      );
      const colaId = tradeShop?.tsId;

      if (!colaId) continue;

      const productResponse = (
        await colaClient.post("/api/ebazaar/productremains", {
          tradeshopid: colaId,
        })
      ).data;

      const activeProducts = productResponse.data;
      const shatlal = productResponse.shatlal;

      const activeProductIds = activeProducts.map(
        (product: any) => product.productid
      );

      registeredProducts.forEach(({ productId, thirdPartyId }) => {
        (activeProductIds.includes(thirdPartyId)
          ? activeProductList
          : inActiveProductList
        ).push(productId);
      });

      await new ColaMrechantProductsPublisher(natsWrapper.client).publish({
        merchantId: merchant.id,
        customerId: IntegrationCustomerIds.cocaCola,
        activeList: activeProductList,
        inActiveList: inActiveProductList,
      });

      activeProductList = [];
      inActiveProductList = [];
    }

    return res.status(StatusCodes.OK).json({ message: "successful" });
  } catch (error: any) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: "Something went wrong.",
    });
  }
});

export { router as colaMerchantProductsRouter };
