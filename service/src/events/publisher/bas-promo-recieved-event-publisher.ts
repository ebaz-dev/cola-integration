import { Publisher } from "@ebazdev/core";
import { BasPromoRecievedEvent } from "../../shared/events/bas-promo-recieved.event";
import { BasPromoSubjects } from "../../shared/events/bas-promo-event-subjects";

export class BasPromoRecievedEventPublisher extends Publisher<BasPromoRecievedEvent> {
  subject: BasPromoSubjects.BasPromoRecieved =
    BasPromoSubjects.BasPromoRecieved;
}
