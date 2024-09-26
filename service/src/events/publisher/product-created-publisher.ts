import { Publisher } from "@ebazdev/core";
import { ColaNewProductEvent } from "../../shared/events/cola-new-product.event";
import { ColaProductSubjects } from "../../shared/events/cola-product-event-subjects";

export class ColaNewProductPublisher extends Publisher<ColaNewProductEvent> {
  subject: ColaProductSubjects.NewProductFound =
    ColaProductSubjects.NewProductFound;
}
