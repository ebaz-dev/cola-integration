import express, { Request, Response } from "express";
import { validateRequest, BadRequestError } from "@ebazdev/core";
import { Product } from "@ebazdev/product";
import { StatusCodes } from "http-status-codes";
import axios from "axios";
import { ColaNewProductPublisher } from "../events/publisher/product-created-publisher";
import { natsWrapper } from "../nats-wrapper";

const router = express.Router();

router.get("/product-list", async (req: Request, res: Response) => {
  try {
    
    const {
      COLA_GET_TOKEN_URI,
      COLA_PRODUCTS_URI,
      COLA_USERNAME,
      COLA_PASSWORD,
    } = process.env.NODE_ENV === "development" ? process.env : process.env;

    if (
      !COLA_GET_TOKEN_URI ||
      !COLA_PRODUCTS_URI
    ) {
      throw new BadRequestError("Cola credentials are missing.");
    }

    const tokenResponse = await axios.post(COLA_GET_TOKEN_URI, {
      username: COLA_USERNAME,
      pass: COLA_PASSWORD,
    });
    const token = tokenResponse.data.token;

    const productsResponse = await axios.post(
      COLA_PRODUCTS_URI,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        maxBodyLength: Infinity,
      }
    );

    const products = productsResponse?.data?.data || [];
    const total = products.length;

    for (const item of products) {
      const product = await Product.findOne({
        "thirdPartyData.productId": item.productid,
      });

      if (!product) {
        await new ColaNewProductPublisher(natsWrapper.client).publish({
          productId: item.productid,
          productName: item.productname,
          sectorName: item.sectorname,
          brandName: item.brandname,
          categoryName: item.categoryname,
          packageName: item.packagename,
          capacity: item.capacity,
          incase: item.incase,
          barcode: item.barcode,
        });
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
    if (error.message === "Cola credentials are missing.") {
      res.status(StatusCodes.BAD_REQUEST).send({
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "Something went wrong.",
      });
    }
  }
});

export { router as colaProductsRouter };
