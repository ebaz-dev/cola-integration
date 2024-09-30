import express from "express";
import "express-async-errors";
import { json } from "body-parser";
import { errorHandler, NotFoundError } from "@ebazdev/core";
import { colaProductsRouter } from "./routes/cola-product-list";
import { colaPromosRouter } from "./routes/cola-promo-list";
import { orderStatusUpdateRouter } from "./routes/order-status";
import { colaLoginRouter } from "./routes/cola-get-token";
import { colaMerchantProductsRouter } from "./routes/cola-merchant-products";
import cookieSession from "cookie-session";
import dotenv from "dotenv";
import { healthRouter } from "./routes/health";
import { orderSendRouter } from "./routes/order-confirm";

dotenv.config();

const apiPrefix = "/api/v1/integration/cola";

const app = express();
app.set("trust proxy", true);
app.use(json());
app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== "test",
  })
);

app.use(apiPrefix, healthRouter);
app.use(apiPrefix, colaProductsRouter);
app.use(apiPrefix, colaPromosRouter);
app.use(apiPrefix, orderStatusUpdateRouter);
app.use(apiPrefix, colaLoginRouter);
app.use(apiPrefix, colaMerchantProductsRouter);
app.use(apiPrefix, orderSendRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
