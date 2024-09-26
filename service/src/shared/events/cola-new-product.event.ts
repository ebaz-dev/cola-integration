import { ColaProductSubjects } from "./cola-product-event-subjects";

export interface ColaNewProductEvent {
  subject: ColaProductSubjects.NewProductFound;
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
