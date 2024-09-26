import { ObjectId } from "mongoose";
import { ColaPromoSubjects } from "./cola-promo-event-subjects";

export interface ColaPromoRecievedEvent {
  subject: ColaPromoSubjects.ColaPromoRecieved;

  data: {
    name: string;
    customerId: string;
    thirdPartyPromoId: number;
    startDate: string;
    endDate: string;
    thresholdQuantity: number;
    promoPercent: number;
    giftQuantity: number;
    isActive: boolean;
    thirdPartyPromoTypeId: number;
    thirdPartyPromoType: string;
    thirdPartyPromoTypeByCode: string;
    tradeshops: number[];
    products: ObjectId[];
    giftProducts: ObjectId[];
    colaProducts: number[];
    colaGiftProducts: number[];
    colaTradeshops: number[];
  };
}
