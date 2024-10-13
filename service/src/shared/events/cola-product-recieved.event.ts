import { ColaProductSubjects } from "./cola-product-event-subjects";

export interface ColaProductRecievedEvent {
  subject: ColaProductSubjects.ColaProductRecieved;
  data: {
    productId: string;
    productName: string;
    sectorName: string;
    brandName: string;
    categoryName: string;
    packageName: string;
    flavorName: string;
    capacity: number;
    incase: number;
    barcode: string;
  };
}
