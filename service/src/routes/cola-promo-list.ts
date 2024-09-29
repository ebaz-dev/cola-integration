import express, { Request, Response } from "express";
import axios from "axios";
import { Product, ProductDoc, Promo, PromoDoc } from "@ebazdev/product";
import { IntegrationCustomerIds } from "../shared/models/cola-customer-names";
import { ColaPromoPublisher } from "../events/publisher/cola-promo-created-publisher";
import { ColaPromoUpdatedPublisher } from "../events/publisher/cola-promo-updated-publisher";
import { StatusCodes } from "http-status-codes";
import { natsWrapper } from "../nats-wrapper";
import {
  PromoDetails,
  promoProducts,
  giftProducts,
  promoTradeshops,
} from "../shared/models/cola-promo";

const router = express.Router();

router.get("/promo-list", async (req: Request, res: Response) => {
  try {
    const {
      COLA_GET_TOKEN_URI,
      COLA_PROMOS_URI,
      COLA_USERNAME,
      COLA_PASSWORD,
    } = process.env;

    if (
      !COLA_GET_TOKEN_URI ||
      !COLA_PROMOS_URI ||
      !COLA_USERNAME ||
      !COLA_PASSWORD
    ) {
      throw new Error("Cola credentials are missing.");
    }

    const tokenResponse = await axios.post(COLA_GET_TOKEN_URI, {
      username: COLA_USERNAME,
      pass: COLA_PASSWORD,
    });

    if (!tokenResponse?.data?.token) {
      throw new Error("Failed to retrieve token from Cola API.");
    }

    const token = tokenResponse.data.token;

    const promosResponse = await axios.post(
      COLA_PROMOS_URI,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        maxBodyLength: Infinity,
      }
    );

    const promoData = promosResponse?.data || {};
    const promoList: PromoDetails[] = promoData.promo_main;

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
        ? matchGiftProducts.GiftProducts
        : [];
      promo.colaTradeshops = matchTradeshops ? matchTradeshops.Tradeshops : [];

      promo.products = await fetchEbazaarProductIds(promo.colaProducts);
      promo.giftProducts = await fetchEbazaarProductIds(promo.colaGiftProducts);

      const existingPromo = (await Promo.findOne({
        thirdPartyPromoId: promo.promoid,
      })) as PromoDoc;

      if (existingPromo) {
        const hasChanges =
          existingPromo.name !== promo.promoname ||
          existingPromo.startDate.getTime() !==
            new Date(promo.startdate).getTime() ||
          existingPromo.endDate.getTime() !==
            new Date(promo.enddate).getTime() ||
          existingPromo.thresholdQuantity !== promo.tresholdquantity ||
          existingPromo.promoPercent !== promo.promopercent ||
          existingPromo.giftQuantity !== promo.giftquantity ||
          existingPromo.isActive !== promo.isactive ||
          existingPromo.thirdPartyPromoTypeId !== promo.promotypeid ||
          existingPromo.thirdPartyPromoType !== promo.promotype ||
          existingPromo.thirdPartyPromoTypeByCode !== promo.promotypebycode ||
          !arraysEqual(existingPromo.products, promo.products) ||
          !arraysEqual(existingPromo.giftProducts, promo.giftProducts) ||
          !arraysEqual(existingPromo.tradeshops, promo.colaTradeshops);

        if (hasChanges) {
          await new ColaPromoUpdatedPublisher(natsWrapper.client).publish({
            id: existingPromo.id.toString(),
            name: promo.promoname,
            customerId: IntegrationCustomerIds.cocaCola,
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
      } else {
        await new ColaPromoPublisher(natsWrapper.client).publish({
          name: promo.promoname,
          customerId: IntegrationCustomerIds.cocaCola,
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
  if (thirdPartyIds && thirdPartyIds.length === 0) {
    return [];
  }
  const products = (await Product.find({
    "thirdPartyData.productId": { $in: thirdPartyIds },
  }).select("_id thirdPartyData.productId")) as ProductDoc[];

  return products.map((product) => product._id);
};

const arraysEqual = (arr1: any, arr2: any) => {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((value: any, index: any) => {
    return value.toString() === arr2[index].toString();
  });
};

export { router as colaPromosRouter };
