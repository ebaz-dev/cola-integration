import { Publisher } from "@ebazdev/core";
import { BasProductUpdatedEvent } from "../../shared/events/bas-product-updated.event";
import { BasProductSubjects } from "../../shared/events/bas-product-event-subjects";

export class BasProductUpdatedEventPublisher extends Publisher<BasProductUpdatedEvent> {
  subject: BasProductSubjects.BasProductUpdated =
    BasProductSubjects.BasProductUpdated;
}
