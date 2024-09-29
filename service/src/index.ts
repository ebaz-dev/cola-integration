import mongoose from "mongoose";
import { app } from "./app";
import { natsWrapper } from "./nats-wrapper";

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

  if (!process.env.COLA_USERNAME) {
    throw new Error("COLA_USERNAME must be defined");
  }

  if (!process.env.COLA_PASSWORD) {
    throw new Error("COLA_PASSWORD must be defined");
  }

  if (!process.env.COLA_GET_TOKEN_URI) {
    throw new Error("COLA_GET_TOKEN_URI must be defined");
  }

  if (!process.env.COLA_PRODUCTS_URI) {
    throw new Error("COLA_PRODUCTS_URI must be defined");
  }

  if (!process.env.COLA_MERCHANT_PRODUCTS_URI) {
    throw new Error("COLA_MERCHANT_PRODUCTS_URI must be defined");
  }

  if (!process.env.COLA_PROMOS_URI) {
    throw new Error("COLA_PROMOS_URI must be defined");
  }

  if (!process.env.TOTAL_USERNAME) {
    throw new Error("TOTAL_USERNAME must be defined");
  }

  if (!process.env.TOTAL_PASSWORD) {
    throw new Error("TOTAL_PASSWORD must be defined");
  }

  if (!process.env.TOTAL_GET_TOKEN_URI) {
    throw new Error("TOTAL_GET_TOKEN_URI must be defined");
  }

  if (!process.env.TOTAL_PRODUCTS_URI) {
    throw new Error("TOTAL_PRODUCTS_URI must be defined");
  }

  if (!process.env.TOTAL_PROMOS_URI) {
    throw new Error("TOTAL_PROMOS_URI must be defined");
  }

  try {
    await natsWrapper.connect(
      process.env.NATS_CLUSTER_ID,
      process.env.NATS_CLIENT_ID,
      process.env.NATS_URL
    );

    natsWrapper.client.on("close", () => {
      console.log("NATS connection closed!");
      process.exit();
    });

    process.on("SIGINT", () => natsWrapper.client.close());
    process.on("SIGTERM", () => natsWrapper.client.close());

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
  } catch (err) {
    console.error(err);
  }

  app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}!!!!!!!!!!`);
  });
};

start();

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
