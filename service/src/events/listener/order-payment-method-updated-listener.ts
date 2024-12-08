import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import { queueGroupName } from "./queue-group-name";

import {
  OrderPaymentMethodUpdatedEvent,
  OrderEventSubjects,
} from "@ebazdev/order";
import { sendOrder } from "../../utils/send-order";

export class OrderPaymentMethodUpdatedListener extends Listener<OrderPaymentMethodUpdatedEvent> {
  readonly subject = OrderEventSubjects.OrderPaymentMethodUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderPaymentMethodUpdatedEvent["data"], msg: Message) {
    try {
      await sendOrder(data.id);
      msg.ack();
    } catch (error) {
      console.error("Error processing OrderPaymentMethodUpdatedEvent:", error);
      msg.ack();
    }
  }
}
