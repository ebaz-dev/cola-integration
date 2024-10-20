import express, { Request, Response } from "express";
import { validateRequest, BadRequestError } from "@ebazdev/core";
import { Product } from "@ebazdev/product";
import { StatusCodes } from "http-status-codes";
import { ColaProductRecievedEventPublisher } from "../events/publisher/cola-product-recieved-publisher";
import { ColaProductsUpdatedEventPublisher } from "../events/publisher/cola-products-updated-publisher";
import { ColaProductDeactivatedEventPublisher } from "../events/publisher/cola-product-deactivated-publisher";
import { BaseAPIClient } from "../shared/utils/cola-api-client";
import { natsWrapper } from "../nats-wrapper";
import { Types } from "mongoose";

const router = express.Router();
const colaClient = new BaseAPIClient();

const colaCustomerId = process.env.COLA_CUSTOMER_ID;

interface ProductData {
  productid: string;
  productname: string;
  sectorname: string;
  brandname: string;
  categoryname: string;
  packagename: string;
  flavorname: string;
  capacity: string;
  incase: number;
  barcode: string;
}

async function convertCapacityToInteger(capacity: string): Promise<number> {
  if (capacity.endsWith("ml")) {
    return parseInt(capacity.replace("ml", ""), 10);
  } else if (capacity.endsWith("L")) {
    return parseFloat(capacity.replace("L", "")) * 1000;
  } else {
    throw new Error(`Unknown capacity format: ${capacity}`);
  }
}

async function sanitizeBarcode(barcode: string): Promise<string> {
  return barcode.trim().replace(/^[\s.]+|[\s.]+$/g, "");
}

router.get("/product-list", async (req: Request, res: Response) => {
  try {
    const productsResponse = await colaClient.post(
      `/api/ebazaar/getdataproductinfo`,
      {}
    );

    const products: ProductData[] = productsResponse?.data?.data || [];
    const total = products.length;

    if (products.length === 0) {
      return res.status(StatusCodes.OK).send({
        data: [],
        total,
        totalPages: 1,
        currentPage: 1,
      });
    }

    const productIds = products.map((item: any) => item.productid);

    const existingProducts = await Product.find({
      customerId: new Types.ObjectId(colaCustomerId),
    });

    let existingIds: any = [];

    const existingProductMap = existingProducts.reduce((map, item) => {
      if (item.thirdPartyData && Array.isArray(item.thirdPartyData)) {
        const colaIntegrationData = item.thirdPartyData.find(
          (data: any) => data?.customerId?.toString() === colaCustomerId
        );

        if (colaIntegrationData) {
          existingIds.push(colaIntegrationData.productId);
          map[colaIntegrationData.productId] = item;
        }
      }
      return map;
    }, {} as { [key: string]: any });

    const newProducts = productIds.filter(
      (item: any) => !Object.keys(existingProductMap).includes(item.toString())
    );

    const deactiveList = Object.keys(existingProductMap).filter((productId) => {
      const existingProduct = existingProductMap[productId];
      return (
        !productIds.includes(parseInt(productId)) &&
        existingProduct.isActive === true
      );
    });

    if (newProducts.length > 0) {
      for (const newProduct of newProducts) {
        const capacity = await convertCapacityToInteger(newProduct.capacity);
        const sanitizedBarcode = await sanitizeBarcode(newProduct.barcode);

        await new ColaProductRecievedEventPublisher(natsWrapper.client).publish(
          {
            productId: newProduct.productid,
            productName: newProduct.productname,
            sectorName: newProduct.sectorname,
            brandName: newProduct.brandname,
            categoryName: newProduct.categoryname,
            packageName: newProduct.packagename,
            flavorName: newProduct.flavorname,
            capacity: capacity,
            incase: newProduct.incase,
            barcode: sanitizedBarcode,
          }
        );
      }
    }

    if (deactiveList.length > 0) {
      for (const deactiveProductId of deactiveList) {
        const existingProduct = existingProductMap[deactiveProductId];

        if (existingProduct) {
          await new ColaProductDeactivatedEventPublisher(
            natsWrapper.client
          ).publish({
            productId: existingProduct._id,
          });
        }
      }
    }

    for (const product of products) {
      const existingProduct = existingProductMap[product.productid];
      if (existingProduct) {
        const updatedFields: any = {};

        const capacity = await convertCapacityToInteger(product.capacity);

        const existingCapacity = existingProduct.attributes?.find(
          (attr: any) => attr.key === "size"
        )?.value;

        const sanitizedBarcode = await sanitizeBarcode(product.barcode);

        if (existingProduct.name !== product.productname) {
          updatedFields.productName = product.productname;
        }

        if (existingCapacity !== capacity) {
          updatedFields.capacity = capacity;
        }

        if (existingProduct.inCase !== product.incase) {
          updatedFields.incase = product.incase;
        }

        if (
          existingProduct.barCode !== sanitizedBarcode &&
          sanitizedBarcode !== ""
        ) {
          updatedFields.barcode = sanitizedBarcode;
        }

        if (Object.keys(updatedFields).length > 0) {
          await new ColaProductsUpdatedEventPublisher(
            natsWrapper.client
          ).publish({
            productId: product.productid,
            updatedFields,
          });
        }
      }
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
