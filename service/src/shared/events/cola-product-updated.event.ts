import { ColaProductSubjects } from "./cola-product-event-subjects";

export interface ColaProductUpdatedEvent {
  subject: ColaProductSubjects.ColaProductUpdated;
  data: {
    productId: string;
    updatedFields: {
      productName?: string;
      brandName?: string;
      packageName?: string;
      capacity?: string;
      incase?: number;
      barcode?: string;
    };
  };
}
