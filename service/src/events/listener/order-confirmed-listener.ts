import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import { queueGroupName } from "./queue-group-name";

import { OrderConfirmedEvent, OrderEventSubjects } from "@ebazdev/order";
import { sendOrder } from "../../utils/send-order";

export class OrderConfirmedListener extends Listener<OrderConfirmedEvent> {
  readonly subject = OrderEventSubjects.OrderConfirmed;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderConfirmedEvent["data"], msg: Message) {
    try {
      await sendOrder(data.id);
      msg.ack();
    } catch (error) {
      console.error("Error processing OrderConfirmedEvent:", error);
      msg.ack();
    }
  }
}
