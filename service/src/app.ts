import express from "express";
import "express-async-errors";
import { json } from "body-parser";
import { errorHandler, NotFoundError } from "@ebazdev/core";
import { colaProductsRouter } from "./routes/cola-product-list";
import { colaPromosRouter } from "./routes/cola-promo-list";
import { colaInboundLoginRouter } from "./routes/cola-inbound-login";
import { orderStatusUpdateRouter } from "./routes/cola-inbound-order-status";
import { colaMerchantProductsRouter } from "./routes/cola-merchant-products";
import { healthRouter } from "./routes/health";
import { orderSendRouter } from "./routes/order-confirm";
import { colaDashboardRouter } from "./routes/cola-dashboard-data";
import { colaProfileRouter } from "./routes/cola-get-profile-";
import cookieSession from "cookie-session";
import dotenv from "dotenv";

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
app.use(apiPrefix, colaInboundLoginRouter);
app.use(apiPrefix, orderStatusUpdateRouter);
app.use(apiPrefix, colaMerchantProductsRouter);
app.use(apiPrefix, orderSendRouter);
app.use(apiPrefix, colaDashboardRouter);
app.use(apiPrefix, colaProfileRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
