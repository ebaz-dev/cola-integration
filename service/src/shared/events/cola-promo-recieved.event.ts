import { ObjectId } from "mongoose";
import { ColaPromoSubjects } from "./cola-promo-event-subjects";
import { IntegrationCustomerNames } from "../models/cola-customer-names";

export interface ColaPromoRecievedEvent {
  subject: ColaPromoSubjects.ColaPromoRecieved;

  data: {
    name: string;
    customerId: IntegrationCustomerNames;
    startDate: string;
    endDate: string;
    thresholdQuantity: number;
    promoPercent: number;
    giftQuantity: number;
    isActive: boolean;
    tradeshops: number[];
    products: ObjectId[];
    giftProducts: ObjectId[];
    thirdPartyPromoId: number;
    thirdPartyPromoTypeId: number;
    thirdPartyPromoType: string;
    thirdPartyPromoTypeCode: string;
    colaProducts: number[];
    colaGiftProducts: number[];
    colaTradeshops: number[];
  };
}
