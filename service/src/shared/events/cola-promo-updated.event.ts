import { Types, ObjectId } from "mongoose";
import { ColaPromoSubjects } from "./cola-promo-event-subjects";
export interface ColaPromoUpdatedEvent {
  subject: ColaPromoSubjects.ColaPromoUpdated;
  data: {
    id: string;
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
