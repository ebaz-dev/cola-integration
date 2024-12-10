import express from "express";
import "express-async-errors";
import { errorHandler, NotFoundError } from "@ebazdev/core";
import { healthRouter } from "./routes/health";
import { json } from "body-parser";
import cookieSession from "cookie-session";
import dotenv from "dotenv";

import { anungooMerchantShatlalRouter } from "./routes/anungoo/anungoo-merchant-shatlal";
import { anungooProductsRouter } from "./routes/anungoo/anungoo-products";
import { anungooPromosRouter } from "./routes/anungoo/anungoo-promos";

import { colaDashboardRouter } from "./routes/coca-cola/cola-dashboard-data";
import { colaMerchantShatlalRouter } from "./routes/coca-cola/cola-merchant-shatlalt";
import { colaProductsRouter } from "./routes/coca-cola/cola-products";
import { colaPromosRouter } from "./routes/coca-cola/cola-promos";

import { marketgateMerchantShatlalRouter } from "./routes/market-gate/marketgate-merchant-shatlal";
import { marketgateProductsRouter } from "./routes/market-gate/marketgate-products";
import { marketgatePromosRouter } from "./routes/market-gate/marketgate-promos";

import { totalMerchantShatlalRouter } from "./routes/total-integration/total-merchant-shatlal";
import { totalProductsRouter } from "./routes/total-integration/total-products";
import { totalPromosRouter } from "./routes/total-integration/total-promos";

import { colaInboundLoginRouter } from "./routes/cola-inbound-login";
import { orderStatusUpdateRouter } from "./routes/cola-inbound-order-status";
import { orderSendRouter } from "./routes/order-send";
import { colaProfileRouter } from "./routes/cola-get-profile";
import { colaPaymentRouter } from "./routes/get-payment";
import { merchantDebtRouter } from "./routes/check-merchant-debt";
import { totalMerchantDebtRouter } from "./routes/total-integration/check-merchant-debt";

dotenv.config();

const apiPrefix = "/api/v1/integration/cola";
const apiBasPrefix = "/api/v1/integration/bas";
const apiTotalPrefix = "/api/v1/integration/total";

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
app.use(apiPrefix, colaInboundLoginRouter);
app.use(apiPrefix, orderStatusUpdateRouter);
app.use(apiPrefix, orderSendRouter);
app.use(apiPrefix, colaDashboardRouter);
app.use(apiPrefix, colaProfileRouter);
app.use(apiPrefix, colaPaymentRouter);
app.use(apiPrefix, merchantDebtRouter);

app.use(apiBasPrefix, anungooProductsRouter);
app.use(apiBasPrefix, anungooPromosRouter);
app.use(apiBasPrefix, anungooMerchantShatlalRouter);

app.use(apiBasPrefix, colaMerchantShatlalRouter);
app.use(apiBasPrefix, colaProductsRouter);
app.use(apiBasPrefix, colaPromosRouter);

app.use(apiBasPrefix, marketgateMerchantShatlalRouter);
app.use(apiBasPrefix, marketgateProductsRouter);
app.use(apiBasPrefix, marketgatePromosRouter);

app.use(apiBasPrefix, totalMerchantShatlalRouter);
app.use(apiBasPrefix, totalProductsRouter);
app.use(apiBasPrefix, totalPromosRouter);
app.use(apiTotalPrefix, totalMerchantDebtRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
