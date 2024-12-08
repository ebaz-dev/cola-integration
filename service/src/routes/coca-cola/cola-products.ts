import express, { Request, Response } from "express";
import { Product } from "@ebazdev/product";
import { Supplier } from "@ebazdev/customer";
import { BadRequestError } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { natsWrapper } from "../../nats-wrapper";
import { Types } from "mongoose";
import { BasProductRecievedEventPublisher } from "../../events/publisher/bas-product-recieved-publisher";
import { BasProductUpdatedEventPublisher } from "../../events/publisher/bas-product-updated-publisher";
import { ColaAPIClient } from "../../utils/apiclients/cocacola-api-client";
import {
  BasProductData,
  ThirdPartyData,
} from "../../shared/models/bas-product";
import {
  convertCapacity,
  barcodeSanitizer,
  eventDelay,
} from "../../utils/bas-product-functions";

const router = express.Router();

router.get("/cola/product-list", async (req: Request, res: Response) => {
  try {
    const colaCustomer = await Supplier.findOne({
      type: "supplier",
      holdingKey: "MCSCC",
    });

    if (!colaCustomer) {
      throw new BadRequestError("Coca Cola supplier not found.");
    }

    const colaSupplierId = colaCustomer?._id as Types.ObjectId;

    const productsResponse = await ColaAPIClient.getClient().post(
      `/api/ebazaar/getdataproductinfo`,
      {}
    );

    const basProducts: BasProductData[] = productsResponse?.data?.data || [];
    if (basProducts.length === 0) {
      throw new BadRequestError("No products from bas API.");
    }

    const existingEbProducts = await Product.find({
      customerId: colaSupplierId,
    });

    const existingEbProductsMap = existingEbProducts.reduce((map, item) => {
      if (item.thirdPartyData && Array.isArray(item.thirdPartyData)) {
        const thirdPartyDataArray = item.thirdPartyData as ThirdPartyData[];

        const colaIntegrationData = thirdPartyDataArray.find(
          (data: ThirdPartyData) => data?.customerId.equals(colaSupplierId)
        );

        if (colaIntegrationData) {
          map[colaIntegrationData.productId] = item;
        }
      }
      return map;
    }, {} as { [key: string]: any });

    const basNewProducts: BasProductData[] = [];
    const basExistingProducts: BasProductData[] = [];

    basProducts.forEach((item: BasProductData) => {
      if (!existingEbProductsMap[item.productid.toString()]) {
        basNewProducts.push(item);
      } else {
        basExistingProducts.push(item);
      }
    });

    if (basNewProducts.length > 0) {
      for (const item of basNewProducts) {
        const capacity = await convertCapacity(item.capacity);
        const sanitizedBarcode = await barcodeSanitizer(item.barcode);

        const eventPayload: any = {
          supplierId: colaSupplierId,
          basId: item.productid,
          productName: item.productname,
          brandName: item.brandname,
          incase: item.incase,
          sectorName: item.sectorname,
          barcode: sanitizedBarcode,
        };

        if (capacity !== 0) {
          eventPayload.capacity = capacity;
        }

        await eventDelay(500);

        await new BasProductRecievedEventPublisher(natsWrapper.client).publish(
          eventPayload
        );
      }
    }

    for (const product of basExistingProducts) {
      const item = existingEbProductsMap[product.productid];

      if (item) {
        const updatedFields: any = {};

        const capacity = await convertCapacity(product.capacity);

        const existingCapacity = item.attributes?.find(
          (attr: any) => attr.key === "size"
        )?.value;

        const sanitizedBarcode = await barcodeSanitizer(product.barcode);

        if (item.name !== product.productname) {
          updatedFields.productName = product.productname;
        }

        if (!item.brandId) {
          updatedFields.brandName = product.brandname;
        }

        if (existingCapacity !== capacity && capacity !== 0) {
          updatedFields.capacity = capacity;
        }

        if (item.inCase !== product.incase) {
          updatedFields.incase = product.incase;
        }

        if (item.barCode !== sanitizedBarcode && sanitizedBarcode !== "") {
          updatedFields.barcode = sanitizedBarcode;
        }

        if (Object.keys(updatedFields).length > 0) {
          await eventDelay(500);

          await new BasProductUpdatedEventPublisher(natsWrapper.client).publish(
            {
              supplierId: colaSupplierId,
              productId: item._id,
              updatedFields,
            }
          );
        }
      }
    }

    res.status(StatusCodes.OK).send({ messge: "Product list fetched." });
  } catch (error: any) {
    console.error("Cola integration cola product list fetch error:", error);
    throw new BadRequestError("Something went wrong.");
  }
});

export { router as colaProductsRouter };
