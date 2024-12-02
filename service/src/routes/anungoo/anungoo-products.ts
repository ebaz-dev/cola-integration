import express, { Request, Response } from "express";
import { validateRequest, BadRequestError } from "@ebazdev/core";
import { Product } from "@ebazdev/product";
import { Supplier } from "@ebazdev/customer";
import { StatusCodes } from "http-status-codes";
import { BasProductRecievedEventPublisher } from "../../events/publisher/bas-product-recieved-publisher";
import { BasProductUpdatedEventPublisher } from "../../events/publisher/bas-product-updated-publisher";
import { BasProductDeactivatedEventPublisher } from "../../events/publisher/bas-product-deactivated-publisher";
import { AnungooAPIClient } from "../../shared/utils/anungoo-api-client";
import { natsWrapper } from "../../nats-wrapper";
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

router.get("/anungoo/product-list", async (req: Request, res: Response) => {
  try {
    const anungoo = await Supplier.find({
      type: "supplier",
      holdingKey: "AG",
    });

    const anungooPng = anungoo?.filter((item) => item?.vendorKey === "AGPNG");
    const anungooIone = anungoo?.filter((item) => item?.vendorKey === "AGIONE");

    const productsResponse = await AnungooAPIClient.getClient().post(
      `/api/ebazaar/getdataproductinfo`,
      {}
    );

    let products: ProductData[] = productsResponse?.data?.data || [];

    products = products.filter(
      (product) => product.business === "ag_nonfood" || product.business === "ag_food"
    );

    const total = products.length;

    if (products.length === 0) {
      return res.status(StatusCodes.OK).send({
        data: [],
        total,
        totalPages: 1,
        currentPage: 1,
      });
    }

    const existingProducts = await Product.find({
      customerId: {$in: [anungooPng[0]?._id, anungooIone[0]?._id]},
    });

    let existingIds: any = [];

    const existingProductMap = existingProducts.reduce((map, item) => {
      if (item.thirdPartyData && Array.isArray(item.thirdPartyData)) {
        const basIntegrationData = item.thirdPartyData.find(
          (data: any) =>
            data?.customerId?.toString() === (anungooPng[0]?._id as Types.ObjectId).toString() ||
            data?.customerId?.toString() === (anungooIone[0]?._id as Types.ObjectId).toString()
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

        const supplierId = newProduct.business === "ag_nonfood" ? anungooPng[0]?._id : anungooIone[0]?._id;

        const eventPayload: any = {
          supplierId: supplierId,
          basId: newProduct.productid,
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

export { router as anungooProductsRouter };
