import { ColaProductSubjects } from "./cola-product-event-subjects";
import { Types } from "mongoose";
export interface ColaProductDeactivatedEvent {
  subject: ColaProductSubjects.ColaProductDeactivated;
  data: {
    productId: Types.ObjectId;
  };
}
