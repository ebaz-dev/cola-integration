import { Types, ObjectId } from "mongoose";
import { BasPromoSubjects } from "./bas-promo-event-subjects";
export interface BasPromoUpdatedEvent {
  subject: BasPromoSubjects.BasPromoUpdated;
  data: {
    supplierId: Types.ObjectId;
    id: Types.ObjectId;
    updatedFields: {
      name?: string;
      startDate?: string;
      endDate?: string;
      thresholdQuantity?: number;
      promoPercent?: number;
      giftQuantity?: number;
      isActive?: boolean;
      tradeshops?: number[];
      products?: ObjectId[];
      giftProducts?: ObjectId[];
    };
  };
}
