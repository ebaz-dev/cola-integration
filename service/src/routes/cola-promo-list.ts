import express, { Request, Response } from "express";
import axios from "axios";
import { Product, ProductDoc, Promo } from "@ebazdev/product";
import { IntegrationCustomerIds } from "../shared/models/integration-customer-ids";
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
import { BaseAPIClient } from "../shared/utils/cola-api-client";

const router = express.Router();
const colaClient = new BaseAPIClient();

router.get("/promo-list", async (req: Request, res: Response) => {
  try {
    const promosResponse = await colaClient.post(
      "/api/ebazaar/getdatapromo",
      {}
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

      const existingPromo = await Promo.findOne({
        thirdPartyPromoId: promo.promoid,
      });

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
