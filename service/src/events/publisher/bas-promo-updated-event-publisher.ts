import { Publisher } from "@ebazdev/core";
import { BasPromoUpdatedEvent } from "../../shared/events/bas-promo-updated.event";
import { BasPromoSubjects } from "../../shared/events/bas-promo-event-subjects";

export class BasPromoUpdatedEventPublisher extends Publisher<BasPromoUpdatedEvent> {
  subject: BasPromoSubjects.BasPromoUpdated = BasPromoSubjects.BasPromoUpdated;
}
