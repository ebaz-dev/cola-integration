import { BasProductSubjects } from "./bas-product-event-subjects";
import { Types } from "mongoose";

export interface BasProductUpdatedEvent {
  subject: BasProductSubjects.BasProductUpdated;
  data: {
    supplierId: Types.ObjectId;
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
