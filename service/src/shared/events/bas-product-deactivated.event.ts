import { BasProductSubjects } from "./bas-product-event-subjects";
import { Types } from "mongoose";
export interface BasProductDeactivatedEvent {
  subject: BasProductSubjects.BasProductDeactivated;
  data: {
    supplierId: Types.ObjectId;
    productId: Types.ObjectId;
  };
}
