import express, { Request, Response } from "express";
import { validateRequest, BadRequestError } from "@ebazdev/core";
import { Product } from "@ebazdev/product";
import { Customer } from "@ebazdev/customer";
import { StatusCodes } from "http-status-codes";
import { BasProductRecievedEventPublisher } from "../events/publisher/bas-product-recieved-publisher";
import { BasProductUpdatedEventPublisher } from "../events/publisher/bas-product-updated-publisher";
import { BasProductDeactivatedEventPublisher } from "../events/publisher/bas-product-deactivated-publisher";
import { AnungooAPIClient } from "../shared/utils/anungoo-api-client";
import { natsWrapper } from "../nats-wrapper";
import { Types } from "mongoose";

const router = express.Router();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  business: string;
}

async function convertCapacityToInteger(capacity: string): Promise<number> {
  if (!capacity) {
    return 0;
  }

  if (typeof capacity !== "string") {
    return 0;
  }

  if (capacity.endsWith("ml")) {
    return parseInt(capacity.replace("ml", ""), 10);
  } else if (capacity.endsWith("L")) {
    return parseFloat(capacity.replace("L", "")) * 1000;
  } else {
    return 0;
  }
}

async function sanitizeBarcode(barcode: string): Promise<string> {
  return barcode.trim().replace(/^[\s.]+|[\s.]+$/g, "");
}

router.get("/bas/product-list", async (req: Request, res: Response) => {
  try {
    const anungoo = await Customer.findOne({
      type: "supplier",
      holdingKey: "AG",
    });
    const anungooId = anungoo?._id;

    const productsResponse = await AnungooAPIClient.getClient().post(
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
      customerId: anungooId,
    });

    let existingIds: any = [];

    const existingProductMap = existingProducts.reduce((map, item) => {
      if (item.thirdPartyData && Array.isArray(item.thirdPartyData)) {
        const basIntegrationData = item.thirdPartyData.find(
          (data: any) => data?.customerId?.toString() === anungooId
        );

        if (basIntegrationData) {
          existingIds.push(basIntegrationData.productId);
          map[basIntegrationData.productId] = item;
        }
      }
      return map;
    }, {} as { [key: string]: any });

    const newProducts = products.filter(
      (item: any) => !Object.keys(existingProductMap).includes(item.toString())
    );

    if (newProducts.length > 0) {
      for (const newProduct of newProducts) {
        const capacity = await convertCapacityToInteger(newProduct.capacity);
        const sanitizedBarcode = newProduct.barcode
          ? await sanitizeBarcode(newProduct.barcode)
          : null;

        const eventPayload: any = {
          productId: newProduct.productid,
          productName: newProduct.productname,
          brandName: newProduct.brandname,
          incase: newProduct.incase,
          business: newProduct.business,
        };

        if (sanitizedBarcode) {
          eventPayload.barcode = sanitizedBarcode;
        }

        if (capacity !== 0) {
          eventPayload.capacity = capacity;
        }

        await delay(500);

        await new BasProductRecievedEventPublisher(natsWrapper.client).publish(
          eventPayload
        );
      }
    }

    res.status(StatusCodes.OK).send({
      data: products,
      total,
      totalPages: 1,
      currentPage: 1,
    });
  } catch (error: any) {
    console.error("Bas integration product list get error:", error);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message: "Something went wrong.",
    });
  }
});

export { router as basProductsRouter };
