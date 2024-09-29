import { Publisher } from "@ebazdev/core";
import { ColaOrderStatusRecievedEvent } from "../../shared/events/cola-order-status-recieved.event";
import { ColaOrderStatusSubjects } from "../../shared/events/cola-order-status-subjects";

export class ColaOrderStatusPublisher extends Publisher<ColaOrderStatusRecievedEvent> {
  subject: ColaOrderStatusSubjects.OrderStatusRecieved =
    ColaOrderStatusSubjects.OrderStatusRecieved;
}
