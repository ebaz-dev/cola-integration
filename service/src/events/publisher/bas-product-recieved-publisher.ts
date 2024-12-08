import { Publisher } from "@ebazdev/core";
import { BasProductRecievedEvent } from "../../shared/events/bas-product-recieved.event";
import { BasProductSubjects } from "../../shared/events/bas-product-event-subjects";

export class BasProductRecievedEventPublisher extends Publisher<BasProductRecievedEvent> {
  subject: BasProductSubjects.BasProductRecieved =
    BasProductSubjects.BasProductRecieved;
}
