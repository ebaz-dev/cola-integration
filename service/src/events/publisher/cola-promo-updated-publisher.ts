import { Publisher } from "@ebazdev/core";
import { ColaPromoUpdatedEvent } from "../../shared/events/cola-promo-updated.event";
import { ColaPromoSubjects } from "../../shared/events/cola-promo-event-subjects";

export class ColaPromoUpdatedPublisher extends Publisher<ColaPromoUpdatedEvent> {
  subject: ColaPromoSubjects.ColaPromoUpdated =
    ColaPromoSubjects.ColaPromoUpdated;
}
