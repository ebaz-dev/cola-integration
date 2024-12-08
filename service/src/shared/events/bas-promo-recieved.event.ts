import { Types, ObjectId } from "mongoose";
import { BasPromoSubjects } from "./bas-promo-event-subjects";
import { giftProductsPackage } from "../models/bas-promo";

export interface BasPromoRecievedEvent {
  subject: BasPromoSubjects.BasPromoRecieved;

  data: {
    supplierId: Types.ObjectId;
    name: string;
    startDate: string;
    endDate: string;
    thresholdQuantity: number;
    promoPercent: number;
    giftQuantity: number;
    isActive: boolean;
    products?: ObjectId[];
    giftProducts?: ObjectId[];
    giftProductPackage?: giftProductsPackage;
    tradeshops?: number[];
    thirdPartyPromoId: number;
    thirdPartyPromoNo: string;
    thirdPartyPromoTypeId: number;
    thirdPartyPromoType: string;
    thirdPartyPromoTypeCode: string;
  };
}
