import { ColaProductSubjects } from "./cola-product-event-subjects";

export interface ColaProductRecievedEvent {
  subject: ColaProductSubjects.ColaProductRecieved;
  data: {
    productId: string;
    productName: string;
    sectorName: string;
    brandName: string;
    capacity: number;
    incase: number;
    barcode: string;
  };
}
