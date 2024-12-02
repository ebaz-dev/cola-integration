import { Publisher } from "@ebazdev/core";
import { BasProductDeactivatedEvent } from "../../shared/events/bas-product-deactivated.event";
import { BasProductSubjects } from "../../shared/events/bas-product-event-subjects";

export class BasProductDeactivatedEventPublisher extends Publisher<BasProductDeactivatedEvent> {
  subject: BasProductSubjects.BasProductDeactivated =
    BasProductSubjects.BasProductDeactivated;
}
