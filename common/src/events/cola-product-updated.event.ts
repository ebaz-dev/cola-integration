import { ColaProductSubjects } from "./cola-product-event-subjects";
import { Types } from "mongoose";

export interface ColaProductUpdatedEvent {
  subject: ColaProductSubjects.ColaProductUpdated;
  data: {
    productId: Types.ObjectId;
    updatedFields: {
      productName?: string;
      brandName?: string;
      capacity?: string;
      incase?: number;
      barcode?: string;
    };
  };
}
