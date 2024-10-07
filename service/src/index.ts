import mongoose from "mongoose";
import { app } from "./app";
import { natsWrapper } from "./nats-wrapper";
import { OrderConfirmedListener } from "./events/listener/order-confirmed-listener";
import { BaseAPIClient } from "./shared/utils/cola-api-client";
import { OrderCreatedListener } from "./events/listener/order-created-listener";

const start = async () => {
  if (!process.env.PORT) {
    throw new Error("PORT must be defined");
  }

  if (!process.env.JWT_KEY) {
    throw new Error("JWT_KEY must be defined");
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI must be defined");
  }

  if (!process.env.NATS_CLIENT_ID) {
    throw new Error("NATS_CLIENT_ID must be defined");
  }

  if (!process.env.NATS_URL) {
    throw new Error("NATS_URL must be defined");
  }

  if (!process.env.NATS_CLUSTER_ID) {
    throw new Error("NATS_CLUSTER_ID must be defined");
  }

  if (!process.env.NATS_USER) {
    throw new Error("NATS_USER must be defined");
  }

  if (!process.env.NATS_PASS) {
    throw new Error("NATS_PASS must be defined");
  }

  if (!process.env.COLA_OUTBOUND_USERNAME) {
    throw new Error("COLA_OUTBOUND_USERNAME must be defined");
  }

  if (!process.env.COLA_OUTBOUND_PASSWORD) {
    throw new Error("COLA_OUTBOUND_PASSWORD must be defined");
  }

  if (!process.env.COLA_BASE_URI) {
    throw new Error("COLA_BASE_API must be defined");
  }

  if (!process.env.COLA_INBOUND_USERNAME) {
    throw new Error("COLA_INBOUND_USERNAME must be defined");
  }

  if (!process.env.COLA_INBOUND_PASSWORD) {
    throw new Error("COLA_INBOUND_PASSWORD must be defined");
  }

  if (!process.env.COLA_INBOUND_ACCESS_TOKEN_SECRET) {
    throw new Error("COLA_INBOUND_ACCESS_TOKEN_SECRET must be defined");
  }

  try {
    await natsWrapper.connect(
      process.env.NATS_CLUSTER_ID,
      process.env.NATS_CLIENT_ID,
      process.env.NATS_URL,
      process.env.NATS_USER,
      process.env.NATS_PASS
    );

    natsWrapper.client.on("close", () => {
      console.log("NATS connection closed!");
      process.exit();
    });

    process.on("SIGINT", () => natsWrapper.client.close());
    process.on("SIGTERM", () => natsWrapper.client.close());

    new OrderConfirmedListener(natsWrapper.client).listen();
    new OrderCreatedListener(natsWrapper.client).listen();

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const colaClient = new BaseAPIClient();

    (async () => {
      try {
        await colaClient.getToken();
        console.log("Token initialized at server startup.");
      } catch (error) {
        console.error("Error initializing token at startup:", error);
      }
    })();
  } catch (err) {
    console.error(err);
  }

  app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}!!!!!!!!!!`);
  });
};

start();
