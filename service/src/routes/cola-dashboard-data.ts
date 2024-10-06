import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BaseAPIClient } from "../shared/utils/cola-api-client";
import { BadRequestError } from "@ebazdev/core";
import { Merchant } from "@ebazdev/customer"

const router = express.Router();
const colaClient = new BaseAPIClient();

const fetchDataFromColaAPI = async (endpoint: string, body: object) => {
  try {
    const response = await colaClient.post(endpoint, body);
    return response?.data?.data ?? [];
  } catch (error: any) {
    if (error.response?.data?.err_msg === "no data") {
      return [];
    }
    throw error;
  }
};

router.get("/dashboard-data", async (req: Request, res: Response) => {
  try {
    const { tradeshopId, customerType } = req.query;
    if (!tradeshopId || !customerType) {
      throw new BadRequestError("Required inputs are missing");
    }

    const merchant = await Merchant.findById(tradeshopId)

    if (!merchant) {
      throw new BadRequestError("merchant not found")
    }

    if (!merchant.tradeShops){
      throw new BadRequestError("cola merchant not registered")
    }

    const integrationData = merchant.tradeShops
    const colaId = integrationData.find((item) => item.holdingKey === "MCSCC")?.tsId;
    
    if (!colaId) {
      throw new BadRequestError("cola merchant not registered")
    }

    const [
      orderList,
      discountList,
      salesPerformance,
      coolerList,
      rackList,
      printingsList,
    ] = await Promise.all([
      fetchDataFromColaAPI("/api/ebazaar/getdatasales", {
        tradeshopid: colaId,
      }),
      fetchDataFromColaAPI("/api/ebazaar/getdatadiscount", {
        tradeshopid: colaId,
      }),
      fetchDataFromColaAPI("/api/ebazaar/getdatared", {
        tradeshopid: colaId,
      }),
      fetchDataFromColaAPI("/api/ebazaar/getdatacooler", {
        tradeshopid: colaId,
        customerType,
      }),
      fetchDataFromColaAPI("/api/ebazaar/getdatampoe", {
        tradeshopid: colaId,
      }),
      fetchDataFromColaAPI("/api/ebazaar/getdataprinting", {
        tradeshopid: colaId,
      }),
    ]);

    const data = {
      orderList,
      discountList,
      salesPerformance,
      coolerList,
      rackList,
      printingsList,
    };

    return res.status(StatusCodes.OK).send(data);
  } catch (error: any) {
    if (error.message === "Required inputs are missing") {
      throw error;
    }
    console.error("Cola integration product list get error:", error);
    return res.status(StatusCodes.BAD_REQUEST).send({ status: "failure" });
  }
});

export { router as colaDashboardRouter };
