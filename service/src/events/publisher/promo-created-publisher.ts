import { Publisher } from "@ebazdev/core";
import { ColaPromoRecievedEvent } from "../../shared/events/cola-promo-recieved.event";
import { ColaPromoSubjects } from "../../shared/events/cola-promo-event-subjects";

export class ColaPromoPublisher extends Publisher<ColaPromoRecievedEvent> {
  subject: ColaPromoSubjects.ColaPromoRecieved =
    ColaPromoSubjects.ColaPromoRecieved;
}
