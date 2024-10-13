import { Publisher } from "@ebazdev/core";
import { ColaProductUpdatedEvent } from "../../shared/events/cola-product-updated.event";
import { ColaProductSubjects } from "../../shared/events/cola-product-event-subjects";

export class ColaProductsUpdatedEventPublisher extends Publisher<ColaProductUpdatedEvent> {
  subject: ColaProductSubjects.ColaProductUpdated =
    ColaProductSubjects.ColaProductUpdated;
}
