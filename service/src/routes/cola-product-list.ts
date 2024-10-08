import express, { Request, Response } from "express";
import { validateRequest, BadRequestError } from "@ebazdev/core";
import { Product } from "@ebazdev/product";
import { StatusCodes } from "http-status-codes";
import { ColaNewProductPublisher } from "../events/publisher/cola-product-created-publisher";
import { ColaProductsUpdatedPublisher } from "../events/publisher/cola-products-updated-publisher"
import { natsWrapper } from "../nats-wrapper";
import { BaseAPIClient } from "../shared/utils/cola-api-client";

const router = express.Router();
const colaClient = new BaseAPIClient();

router.get("/product-list", async (req: Request, res: Response) => {
  try {
    const productsResponse = await colaClient.post(
      `/api/ebazaar/getdataproductinfo`,
      {}
    );

    const products = productsResponse?.data?.data || [];
    const total = products.length;

    const productIds = products.map((item: any) => item.productid);

    const existingProducts = await Product.find({
      "thirdPartyData.productId": { $in: productIds },
    });

    const existingProductIds = existingProducts
      .map((item) => {
        if (Array.isArray(item.thirdPartyData)) {
          const colaIntegrationData = item.thirdPartyData.find((data: any) => {
            return data?.customerId?.toString() === "66ebe3e3c0acbbab7824b195";
          });
          return colaIntegrationData?.productId;
        }
        return undefined;
      })
      .filter(
        (productId: string | undefined): productId is string => !!productId
      );

    const newProducts = products.filter(
      (item: any) => !existingProductIds.includes(item.productid)
    );

    for (const product of products) {

      await new ColaProductsUpdatedPublisher(natsWrapper.client).publish({
        productId: product.productid,
        productName: product.productname,
        sectorName: product.sectorname,
        brandName: product.brandname,
        categoryName: product.categoryname,
        packageName: product.packagename,
        capacity: product.capacity,
        incase: product.incase,
        barcode: product.barcode,
      });
    }

    for (const newProduct of newProducts) {
      await new ColaNewProductPublisher(natsWrapper.client).publish({
        productId: newProduct.productid,
        productName: newProduct.productname,
        sectorName: newProduct.sectorname,
        brandName: newProduct.brandname,
        categoryName: newProduct.categoryname,
        packageName: newProduct.packagename,
        capacity: newProduct.capacity,
        incase: newProduct.incase,
        barcode: newProduct.barcode,
      });
    } 

    res.status(StatusCodes.OK).send({
      data: products,
      total,
      totalPages: 1,
      currentPage: 1,
    });
  } catch (error: any) {
    console.error("Cola integration product list get error:", error);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: "Something went wrong.",
    });
  }
});

export { router as colaProductsRouter };
