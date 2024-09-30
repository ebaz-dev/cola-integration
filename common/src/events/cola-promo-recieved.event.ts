import { ObjectId } from "mongoose";
import { ColaPromoSubjects } from "./cola-promo-event-subjects";
import { IntegrationCustomerIds } from "../models/integration-customer-ids";

export interface ColaPromoRecievedEvent {
  subject: ColaPromoSubjects.ColaPromoRecieved;

  data: {
    name: string;
    customerId: IntegrationCustomerIds;
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
