import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import axios from "axios";
import { Merchant } from "@ebazdev/customer";
import { IntegrationCustomerIds } from "../shared/models/integration-customer-ids";
import { Product } from "@ebazdev/product";
import { ColaMrechantProductsPublisher } from "../events/publisher/cola-merchant-product-updated-publisher";
import { natsWrapper } from "../nats-wrapper";

const router = express.Router();

interface RegisteredProduct {
  productId: string;
  thirdPartyId: string | null;
}

router.get("/merchant/product-list", async (req: Request, res: Response) => {
  try {
    const {
      COLA_GET_TOKEN_URI,
      COLA_MERCHANT_PRODUCTS_URI,
      COLA_USERNAME,
      COLA_PASSWORD,
    } = process.env;

    if (
      !COLA_GET_TOKEN_URI ||
      !COLA_USERNAME ||
      !COLA_PASSWORD ||
      !COLA_MERCHANT_PRODUCTS_URI
    ) {
      console.error("Merchant products fetch: Cola credentials are missing.");
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "Cola credentials are missing.",
      });
    }

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

    const token = await getColaToken(
      COLA_GET_TOKEN_URI,
      COLA_USERNAME,
      COLA_PASSWORD
    );

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

      const activeProducts = await fetchMerchantProducts(
        COLA_MERCHANT_PRODUCTS_URI,
        token,
        colaId
      );
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
    }

    return res.send({
      activeProductList: activeProductList,
      inActiveProductList: inActiveProductList,
    });
  } catch (error: any) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: "Something went wrong.",
    });
  }
});

const getColaToken = async (
  uri: string,
  username: string,
  password: string
) => {
  const { data } = await axios.post(uri, { username, pass: password });
  return data.token;
};

const fetchMerchantProducts = async (
  uri: string,
  token: string,
  colaId: string
): Promise<any[]> => {
  const { data } = await axios.post(
    uri,
    { tradeshopid: parseInt(colaId) },
    {
      headers: { Authorization: `Bearer ${token}` },
      maxBodyLength: Infinity,
    }
  );
  return data?.data || [];
};

export { router as colaMerchantProductsRouter };
