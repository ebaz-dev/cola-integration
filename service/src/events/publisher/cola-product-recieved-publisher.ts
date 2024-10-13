import { Publisher } from "@ebazdev/core";
import { ColaProductRecievedEvent } from "../../shared/events/cola-product-recieved.event";
import { ColaProductSubjects } from "../../shared/events/cola-product-event-subjects";

export class ColaProductRecievedEventPublisher extends Publisher<ColaProductRecievedEvent> {
  subject: ColaProductSubjects.ColaProductRecieved =
    ColaProductSubjects.ColaProductRecieved;
}
