import express, { Request, Response } from "express";
import axios from "axios";
import { StatusCodes } from "http-status-codes";
import { BaseAPIClient } from "../shared/utils/cola-api-client";
import { BadRequestError } from "@ebazdev/core";

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

    const [
      orderList,
      discountList,
      salesPerformance,
      coolerList,
      rackList,
      printingsList,
    ] = await Promise.all([
      fetchDataFromColaAPI("/api/ebazaar/getdatasales", {
        tradeshopid: tradeshopId,
      }),
      fetchDataFromColaAPI("/api/ebazaar/getdatadiscount", {
        tradeshopid: tradeshopId,
      }),
      fetchDataFromColaAPI("/api/ebazaar/getdatared", {
        tradeshopid: tradeshopId,
      }),
      fetchDataFromColaAPI("/api/ebazaar/getdatacooler", {
        tradeshopid: tradeshopId,
        customerType,
      }),
      fetchDataFromColaAPI("/api/ebazaar/getdatampoe", {
        tradeshopid: tradeshopId,
      }),
      fetchDataFromColaAPI("/api/ebazaar/getdataprinting", {
        tradeshopid: tradeshopId,
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
