import express from "express";
import "express-async-errors";
import { errorHandler, NotFoundError } from "@ebazdev/core";
import { healthRouter } from "./routes/health";
import { json } from "body-parser";
import cookieSession from "cookie-session";
import dotenv from "dotenv";

import { basInboundLoginRouter } from "./routes/bas-inbound-login";
import { basInboundorderStatusUpdateRouter } from "./routes/bas-inbound-order-status";

import { anungooMerchantShatlalRouter } from "./routes/anungoo/ag-merchant-shatlal";
import { anungooProductsRouter } from "./routes/anungoo/ag-products";
import { anungooProfileRouter } from "./routes/anungoo/ag-profile";
import { anungooPromosRouter } from "./routes/anungoo/ag-promos";

import { colaMerchantDebtRouter } from "./routes/coca-cola/cola-check-merchant-debt";
import { colaDashboardRouter } from "./routes/coca-cola/cola-dashboard-data";
import { colaProfileRouter } from "./routes/coca-cola/cola-get-profile";
import { colaMerchantShatlalRouter } from "./routes/coca-cola/cola-merchant-shatlalt";
import { colaProductsRouter } from "./routes/coca-cola/cola-products";
import { colaPromosRouter } from "./routes/coca-cola/cola-promos";
import { colaPaymentRouter } from "./routes/coca-cola/get-payment";
import { colaOrderSendRouter } from "./routes/coca-cola/order-send";

import { marketgateMerchantShatlalRouter } from "./routes/market-gate/mg-merchant-shatlal";
import { marketgateProductsRouter } from "./routes/market-gate/mg-products";
import { marketgatePromosRouter } from "./routes/market-gate/mg-promos";

import { totalMerchantShatlalRouter } from "./routes/total-integration/total-merchant-shatlal";
import { totalProductsRouter } from "./routes/total-integration/total-products";
import { totalPromosRouter } from "./routes/total-integration/total-promos";
import { totalMerchantDebtRouter } from "./routes/total-integration/total-check-merchant-debt";

dotenv.config();

const apiPrefix = "/api/v1/integration";

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

app.use(apiPrefix, basInboundLoginRouter);
app.use(apiPrefix, basInboundorderStatusUpdateRouter);


app.use(apiPrefix, anungooProductsRouter);
app.use(apiPrefix, anungooPromosRouter);
app.use(apiPrefix, anungooProfileRouter);
app.use(apiPrefix, anungooMerchantShatlalRouter);

app.use(apiPrefix, colaMerchantDebtRouter);
app.use(apiPrefix, colaDashboardRouter);
app.use(apiPrefix, colaProfileRouter);
app.use(apiPrefix, colaMerchantShatlalRouter);
app.use(apiPrefix, colaProductsRouter);
app.use(apiPrefix, colaPromosRouter);
app.use(apiPrefix, colaPaymentRouter);
app.use(apiPrefix, colaOrderSendRouter);

app.use(apiPrefix, marketgateMerchantShatlalRouter);
app.use(apiPrefix, marketgateProductsRouter);
app.use(apiPrefix, marketgatePromosRouter);

app.use(apiPrefix, totalMerchantShatlalRouter);
app.use(apiPrefix, totalProductsRouter);
app.use(apiPrefix, totalPromosRouter);
app.use(apiPrefix, totalMerchantDebtRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
