import express, { Request, Response } from "express";
import { BadRequestError } from "@ebazdev/core";
import { Product, ProductDoc } from "@ebazdev/product";
import { StatusCodes } from "http-status-codes";
import axios from "axios";
import { ColaPromoPublisher } from "../events/publisher/promo-created-publisher";
import { natsWrapper } from "../nats-wrapper";
import mongoose, { Types, ObjectId } from "mongoose";
import {
  Promo,
  ColaPromoProduct,
  ColaPromoGiftProduct,
  ColaPromoTradeshops,
} from "../shared/models/cola-promo";

const router = express.Router();

router.get("/promo-list", async (req: Request, res: Response) => {
  try {
    const {
      COLA_CUSTOMER_ID,
      COLA_GET_TOKEN_URL,
      COLA_PROMOS_URL,
      COLA_USERNAME,
      COLA_PASSWORD,
    } = process.env;

    if (
      !COLA_CUSTOMER_ID ||
      !COLA_GET_TOKEN_URL ||
      !COLA_PROMOS_URL ||
      !COLA_USERNAME ||
      !COLA_PASSWORD
    ) {
      throw new BadRequestError("Cola credentials are missing.");
    }

    const tokenResponse = await axios.post(COLA_GET_TOKEN_URL, {
      username: COLA_USERNAME,
      pass: COLA_PASSWORD,
    });

    if (!tokenResponse?.data?.token) {
      throw new Error("Failed to retrieve token from Cola API.");
    }

    const token = tokenResponse.data.token;

    const promosResponse = await axios.post(
      COLA_PROMOS_URL,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        maxBodyLength: Infinity,
      }
    );

    const promoData = promosResponse?.data || {};

    const total = promoData.promo_main.length;

    const promoList: Promo[] = promoData.promo_main;

    if (promoList.length === 0) {
      throw new Error("No promos found.");
    }

    const colaCustomerId = COLA_CUSTOMER_ID;

    const promoProducts: ColaPromoProduct[] = promoData.promo_products || [];
    const promoGiftProducts: ColaPromoGiftProduct[] =
      promoData.promo_giftproducts || [];
    const promoTradeshops: ColaPromoTradeshops[] =
      promoData.promo_tradeshops || [];

    for (const promo of promoList) {
      const matchingProducts = promoProducts.find(
        (p) => p.PromoID === promo.promoid
      );
      const matchingGiftProducts = promoGiftProducts.find(
        (p) => p.PromoID === promo.promoid
      );
      const matchingTradeshops = promoTradeshops.find(
        (p) => p.PromoID === promo.promoid
      );

      promo.colaProducts = matchingProducts ? matchingProducts.Products : [];
      promo.colaGiftProducts = matchingGiftProducts
        ? matchingGiftProducts.Products
        : [];
      promo.colaTradeshops = matchingTradeshops
        ? matchingTradeshops.Tradeshops
        : [];

      promo.products = await fetchEbazaarProductIds(promo.colaProducts);
      promo.giftProducts = await fetchEbazaarProductIds(promo.colaGiftProducts);

      await new ColaPromoPublisher(natsWrapper.client).publish({
        name: promo.promoname,
        customerId: colaCustomerId,
        thirdPartyPromoId: promo.promoid,
        startDate: promo.startdate,
        endDate: promo.enddate,
        thresholdQuantity: promo.tresholdquantity,
        promoPercent: promo.promopercent,
        giftQuantity: promo.giftquantity,
        isActive: promo.isactive,
        thirdPartyPromoTypeId: promo.promotypeid,
        thirdPartyPromoType: promo.promotype,
        thirdPartyPromoTypeByCode: promo.promotypebycode,
        tradeshops: promo.colaTradeshops,
        products: promo.products,
        giftProducts: promo.giftProducts,
        colaProducts: promo.colaProducts,
        colaGiftProducts: promo.colaGiftProducts,
        colaTradeshops: promo.colaTradeshops,
      });
    }

    res.status(StatusCodes.OK).send({
      data: promoList,
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
    } else if (error.message === "No promos found.") {
      res.status(StatusCodes.NOT_FOUND).send({
        message: error.message,
      });
    } else if (error.message === "Failed to retrieve token from Cola API.") {
      res.status(StatusCodes.UNAUTHORIZED).send({ message: error.message });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "Something went wrong.",
      });
    }
  }
});

const fetchEbazaarProductIds = async (
  thirdPartyIds: number[]
): Promise<any> => {
  if (thirdPartyIds.length === 0) return [];
  const products = (await Product.find({
    "thirdPartyData.productId": { $in: thirdPartyIds },
  }).select("_id thirdPartyData.productId")) as ProductDoc[];

  return products.map((product) => product._id);
};

export { router as colaPromosRouter };
