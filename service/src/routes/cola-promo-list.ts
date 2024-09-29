import express, { Request, Response } from "express";
import axios from "axios";
import { BadRequestError } from "@ebazdev/core";
import { Product, ProductDoc } from "@ebazdev/product";
import { IntegrationCustomerNames } from "../shared/models/cola-customer-names";
import { ColaPromoPublisher } from "../events/publisher/promo-created-publisher";
import { StatusCodes } from "http-status-codes";
import { natsWrapper } from "../nats-wrapper";
import {
  Promo,
  promoProducts,
  giftProducts,
  promoTradeshops,
} from "../shared/models/cola-promo";

const router = express.Router();

router.get("/promo-list", async (req: Request, res: Response) => {
  try {
    const {
      COLA_GET_TOKEN_URL,
      COLA_PROMOS_URL,
      COLA_USERNAME,
      COLA_PASSWORD,
    } = process.env;

    if (
      !COLA_GET_TOKEN_URL ||
      !COLA_PROMOS_URL ||
      !COLA_USERNAME ||
      !COLA_PASSWORD
    ) {
      throw new Error("Cola credentials are missing.");
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
    const promoList: Promo[] = promoData.promo_main;

    if (promoList.length === 0) {
      throw new Error("No promos found.");
    }

    const promoProducts: promoProducts[] = promoData.promo_products || [];
    const giftProducts: giftProducts[] = promoData.promo_giftproducts || [];
    const promoTradeshops: promoTradeshops[] = promoData.promo_tradeshops || [];

    for (const promo of promoList) {
      const matchProducts = promoProducts.find(
        (p) => p.PromoID === promo.promoid
      );

      const matchGiftProducts = giftProducts.find(
        (p) => p.PromoID === promo.promoid
      );

      const matchTradeshops = promoTradeshops.find(
        (p) => p.PromoID === promo.promoid
      );

      promo.colaProducts = matchProducts ? matchProducts.Products : [];
      promo.colaGiftProducts = matchGiftProducts
        ? matchGiftProducts.Products
        : [];
      promo.colaTradeshops = matchTradeshops ? matchTradeshops.Tradeshops : [];

      promo.products = await fetchEbazaarProductIds(promo.colaProducts);
      promo.giftProducts = await fetchEbazaarProductIds(promo.colaGiftProducts);

      await new ColaPromoPublisher(natsWrapper.client).publish({
        name: promo.promoname,
        customerId: IntegrationCustomerNames.cocaCola,
        startDate: promo.startdate,
        endDate: promo.enddate,
        thresholdQuantity: promo.tresholdquantity,
        promoPercent: promo.promopercent,
        giftQuantity: promo.giftquantity,
        isActive: promo.isactive,
        tradeshops: promo.colaTradeshops,
        products: promo.products,
        giftProducts: promo.giftProducts,
        thirdPartyPromoId: promo.promoid,
        thirdPartyPromoTypeId: promo.promotypeid,
        thirdPartyPromoType: promo.promotype,
        thirdPartyPromoTypeCode: promo.promotypebycode,
        colaProducts: promo.colaProducts,
        colaGiftProducts: promo.colaGiftProducts,
        colaTradeshops: promo.colaTradeshops,
      });
    }

    return res.status(StatusCodes.OK).send({ status: "success" });
  } catch (error: any) {
    console.error("Cola integration product list get error:", error);

    return res.status(StatusCodes.BAD_REQUEST).send({
      satus: "failure",
    });
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
