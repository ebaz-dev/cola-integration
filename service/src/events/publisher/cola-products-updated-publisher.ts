import { Publisher } from "@ebazdev/core";
import { ColaProductsUpdatedEvent } from "../../shared/events/cola-product-updated.event";
import { ColaProductSubjects } from "../../shared/events/cola-product-event-subjects";

export class ColaProductsUpdatedPublisher extends Publisher<ColaProductsUpdatedEvent> {
  subject: ColaProductSubjects.ColaProductUpdated =
    ColaProductSubjects.ColaProductUpdated;
}
