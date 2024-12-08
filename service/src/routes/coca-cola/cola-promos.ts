import express, { Request, Response } from "express";
import { Product, ProductDoc, Promo } from "@ebazdev/product";
import { Supplier } from "@ebazdev/customer";
import { BadRequestError } from "@ebazdev/core";
import { StatusCodes } from "http-status-codes";
import { natsWrapper } from "../../nats-wrapper";
import { Types, ObjectId } from "mongoose";
import {
  basPromoMain,
  basPromoProducts,
  basPromoGiftProducts,
  basPromoGiftProductsPackage,
  basPromoTradeshops,
} from "../../shared/models/bas-promo";
import { ColaAPIClient } from "../../utils/apiclients/cocacola-api-client";
import { BasPromoRecievedEventPublisher } from "../../events/publisher/bas-promo-recieved-event-publisher";
import { BasPromoUpdatedEventPublisher } from "../../events/publisher/bas-promo-updated-event-publisher";

const router = express.Router();

router.get("/promo-list", async (req: Request, res: Response) => {
  try {
    const colaCustomer = await Supplier.findOne({
      type: "supplier",
      holdingKey: "MCSCC",
    });

    if (!colaCustomer) {
      throw new BadRequestError("Coca Cola supplier not found.");
    }

    const colaSupplierId = colaCustomer?._id as Types.ObjectId;

    const promosResponse = await ColaAPIClient.getClient().post(
      "/api/ebazaar/getdatapromo",
      {}
    );

    const promoData = promosResponse?.data || {};
    const basPromoMainList: basPromoMain[] = promoData.promo_main;

    if (basPromoMainList.length === 0) {
      throw new Error("No promos found.");
    }

    const basPromoProducts: basPromoProducts[] = promoData.promo_products || [];
    const basPromoGiftProducts: basPromoGiftProducts[] =
      promoData.promo_giftproducts || [];
    const basGiftProductPackas: basPromoGiftProductsPackage[] =
      promoData.promo_giftproductspackage || [];
    const basPromoTradeshops: basPromoTradeshops[] =
      promoData.promo_tradeshops || [];

    for (const promo of basPromoMainList) {
      const matchProducts = basPromoProducts.find(
        (p) => p.PromoID === promo.promoid
      );

      const matchGiftProducts = basPromoGiftProducts.find(
        (p) => p.PromoID === promo.promoid
      );

      const matchGiftProductPackage = basGiftProductPackas.find(
        (p) => p.promoid === promo.promoid
      );

      const matchTradeshops = basPromoTradeshops.find(
        (p) => p.PromoID === promo.promoid
      );

      promo.thirdPartyProducts = matchProducts ? matchProducts.Products : [];
      promo.thirdPartyGiftProducts = matchGiftProducts
        ? matchGiftProducts.GiftProducts
        : [];

      if (matchGiftProductPackage) {
        promo.thirdPartyGiftProductPackage = matchGiftProductPackage;
      }

      promo.thirdPartyTradeshops = matchTradeshops
        ? matchTradeshops.Tradeshops
        : [];

      const { customerId: promoSupplierId, productIds: productIds1 } =
        await fetchEbazaarProductIds(promo.thirdPartyProducts, colaSupplierId);
      promo.products = productIds1;

      const { customerId: customerId2, productIds: productIds2 } =
        await fetchEbazaarProductIds(
          promo.thirdPartyGiftProducts,
          colaSupplierId
        );
      promo.giftProducts = productIds2;
      promo.tradeshops = promo.thirdPartyTradeshops;

      const existingPromo = await Promo.findOne({
        "thirdPartyData.thirdPartyPromoId": promo.promoid,
      });

      if (existingPromo && promo.promotypebycode) {
        const updatedFields = getUpdatedFields(existingPromo, promo);

        if (Object.keys(updatedFields).length > 0) {
          await new BasPromoUpdatedEventPublisher(natsWrapper.client).publish({
            supplierId: promo.supplierId as unknown as Types.ObjectId,
            id: existingPromo.id,
            updatedFields,
          });
        }
      } else {
        if (
          (promo.products.length > 0 || promo.giftProducts.length > 0) &&
          promo.promotypebycode
        ) {
          await new BasPromoRecievedEventPublisher(natsWrapper.client).publish({
            supplierId: promo.supplierId as unknown as Types.ObjectId,
            name: promo.promoname,
            startDate: promo.startdate,
            endDate: promo.enddate,
            thresholdQuantity: promo.tresholdquantity,
            promoPercent: promo.promopercent ?? 0,
            giftQuantity: promo.giftquantity ?? 0,
            isActive: promo.isactive,
            tradeshops: promo.tradeshops,
            products: promo.products,
            giftProducts: promo.giftProducts,
            giftProductPackage: promo.giftProductPackage,
            thirdPartyPromoId: promo.promoid,
            thirdPartyPromoNo: promo.promono,
            thirdPartyPromoTypeId: promo.promotypeid,
            thirdPartyPromoType: promo.promotype,
            thirdPartyPromoTypeCode: promo.promotypebycode,
          });
        }
      }
    }

    return res.status(StatusCodes.OK).send({ status: "success" });
  } catch (error: any) {
    console.error("Cola integration promo list get error:", error);

    return res.status(StatusCodes.BAD_REQUEST).send({
      status: "failure",
    });
  }
});

const fetchEbazaarProductIds = async (
  thirdPartyIds: number[],
  colaSupplierId: Types.ObjectId
): Promise<{ customerId: ObjectId | null; productIds: ObjectId[] }> => {
  if (!thirdPartyIds || thirdPartyIds.length === 0) {
    return { customerId: null, productIds: [] };
  }

  const products = (await Product.find({
    "thirdPartyData.productId": { $in: thirdPartyIds },
    customerId: colaSupplierId,
  }).select("_id thirdPartyData.productId customerId")) as ProductDoc[];

  if (products.length === 0) {
    return { customerId: null, productIds: [] };
  }

  const customerId = products[0].customerId as unknown as ObjectId;
  const productIds = products.map((product) => product._id as ObjectId);

  return { customerId, productIds };
};

const arraysEqual = (arr1: any[], arr2: any[]): boolean => {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
    return false;
  }

  if (arr1.length !== arr2.length) {
    return false;
  }

  return arr1.every(
    (value, index) => value.toString() === arr2[index].toString()
  );
};

const getUpdatedFields = (existingPromo: any, promo: any): any => {
  const updatedFields: any = {};

  if (existingPromo.name !== promo.promoname) {
    updatedFields.name = promo.promoname;
  }

  if (
    existingPromo.startDate.getTime() !== new Date(promo.startdate).getTime()
  ) {
    updatedFields.startDate = promo.startdate;
  }

  if (existingPromo.endDate.getTime() !== new Date(promo.enddate).getTime()) {
    updatedFields.endDate = promo.enddate;
  }

  if (existingPromo.thresholdQuantity !== promo.tresholdquantity) {
    updatedFields.thresholdQuantity = promo.tresholdquantity;
  }

  const promoPercent = promo.promopercent ?? 0;
  if (existingPromo.promoPercent !== promoPercent) {
    updatedFields.promoPercent = promoPercent;
  }

  const giftQuantity = promo.giftquantity ?? 0;
  if (existingPromo.giftQuantity !== giftQuantity) {
    updatedFields.giftQuantity = giftQuantity;
  }

  if (existingPromo.isActive !== promo.isactive) {
    updatedFields.isActive = promo.isactive;
  }

  if (!arraysEqual(existingPromo.products, promo.products)) {
    updatedFields.products = promo.products;
  }

  if (!arraysEqual(existingPromo.giftProducts, promo.giftProducts)) {
    updatedFields.giftProducts = promo.giftProducts;
  }

  if (!arraysEqual(existingPromo.tradeshops, promo.tradeshops)) {
    updatedFields.tradeshops = promo.tradeshops;
  }

  return updatedFields;
};

export { router as colaPromosRouter };
