import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BaseAPIClient } from "../../shared/utils/cola-api-client";
import { BadRequestError, NotFoundError } from "@ebazdev/core";
import { Merchant } from "@ebazdev/customer";

const router = express.Router();
const colaClient = new BaseAPIClient();

router.get("/cola/payment", async (req: Request, res: Response) => {
  try {
    const { tradeshopId } = req.query;

    if (!tradeshopId) {
      throw new BadRequestError("tradeshopId required");
    }

    const merchant = await Merchant.findById(tradeshopId);

    if (!merchant) {
      throw new BadRequestError("merchant not found");
    }

    if (!merchant.tradeShops) {
      throw new BadRequestError("cola merchant not registered");
    }

    const integrationData = merchant.tradeShops;
    const colaId = integrationData.find(
      (item) => item.holdingKey === "MCSCC"
    )?.tsId;

    if (!colaId) {
      throw new BadRequestError("cola merchant not registered");
    }

    const paymentResponse = await colaClient.post(
      "/api/ebazaar/getdatapayment",
      { tradeshopid: colaId }
    );

    const paymentData = paymentResponse?.data?.data ?? [];

    if (paymentData.length === 0) {
      throw new NotFoundError();
    }

    const filter: any = {};

    if (req.query.invoiceid) {
      filter.invoiceid = req.query.invoiceid;
    }
    if (req.query.orderno) {
      filter.orderno = req.query.orderno;
    }
    if (req.query.SaleRepId) {
      filter.SaleRepId = req.query.SaleRepId;
    }

    return res.status(StatusCodes.OK).send({ data: paymentData });
  } catch (error: any) {
    if (error.response?.data?.err_msg === "no data") {
      throw new NotFoundError();
    } else if (
      error instanceof BadRequestError ||
      error instanceof NotFoundError
    ) {
      throw error;
    } else {
      console.error("Cola integration payment list get error:", error);
      throw new BadRequestError("Something went wrong");
    }
  }
});

export { router as colaPaymentRouter };
