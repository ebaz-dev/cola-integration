import { ColaProductSubjects } from "./cola-product-event-subjects";

export interface ColaProductsUpdatedEvent {
  subject: ColaProductSubjects.ColaProductUpdated;
  data: {
    productId: string;
    productName: string;
    sectorName: string;
    brandName: string;
    categoryName: string;
    packageName: string;
    capacity: string;
    incase: number;
    barcode: string;
  };
}
