import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import { queueGroupName } from "./queue-group-name";

import { OrderCreatedEvent, OrderEventSubjects } from "@ebazdev/order";
import { sendOrder } from "../../utils/send-order";

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
    readonly subject = OrderEventSubjects.OrderCreated;
    queueGroupName = queueGroupName;

    async onMessage(data: OrderCreatedEvent["data"], msg: Message) {
        try {
            await sendOrder(data.id);
            msg.ack();
        } catch (error) {
            console.error("Error processing InvoicePaidEvent:", error);
            msg.ack();
        }
    }
}
