import { Publisher } from "@ebazdev/core";
import { ColaProductDeactivatedEvent } from "../../shared/events/cola-product-deactivated.event";
import { ColaProductSubjects } from "../../shared/events/cola-product-event-subjects";

export class ColaProductDeactivatedEventPublisher extends Publisher<ColaProductDeactivatedEvent> {
  subject: ColaProductSubjects.ColaProductDeactivated =
    ColaProductSubjects.ColaProductDeactivated;
}
