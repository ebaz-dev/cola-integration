import express from "express";
import "express-async-errors";
import { json } from "body-parser";
import { errorHandler, NotFoundError } from "@ebazdev/core";
import { colaProductsRouter } from "./routes/cola-product-list";
import { colaPromosRouter } from "./routes/cola-promo-list";
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

app.use(apiPrefix, colaProductsRouter);
app.use(apiPrefix, colaPromosRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
