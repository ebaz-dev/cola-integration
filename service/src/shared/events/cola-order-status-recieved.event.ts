import { colaOrderStatuses } from "../models/cola-order-statuses";
import { ColaOrderStatusSubjects } from "./cola-order-status-subjects";

export interface ColaOrderStatusRecievedEvent {
  subject: ColaOrderStatusSubjects.OrderStatusRecieved;

  data: {
    orderId: string;
    status: colaOrderStatuses;
  };
}
