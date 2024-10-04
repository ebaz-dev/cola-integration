import express, { Request, Response } from "express";
import axios from "axios";
import { StatusCodes } from "http-status-codes";

const router = express.Router();

const { COLA_API, COLA_USERNAME, COLA_PASSWORD } = process.env;

const fetchDataFromColaAPI = async (
  endpoint: string,
  body: object,
  token: string
) => {
  try {
    const response = await axios.post(COLA_API! + endpoint, body, {
      headers: { Authorization: `Bearer ${token}` },
      maxBodyLength: Infinity,
    });
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
    const { tradeshopid, customerType } = req.query;

    const tokenResponse = await axios.post(COLA_API! + "/api/tokenbazaar", {
      username: COLA_USERNAME!,
      pass: COLA_PASSWORD!,
    });

    if (!tokenResponse?.data?.token) {
      throw new Error("Failed to retrieve token from Cola API.");
    }

    const token = tokenResponse.data.token;

    const [
      orderList,
      discountList,
      salesPerformance,
      coolerList,
      rackList,
      printingsList,
    ] = await Promise.all([
      fetchDataFromColaAPI("/api/ebazaar/getdatasales", { tradeshopid }, token),
      fetchDataFromColaAPI(
        "/api/ebazaar/getdatadiscount",
        { tradeshopid },
        token
      ),
      fetchDataFromColaAPI("/api/ebazaar/getdatared", { tradeshopid }, token),
      fetchDataFromColaAPI(
        "/api/ebazaar/getdatacooler",
        { tradeshopid, customerType },
        token
      ),
      fetchDataFromColaAPI("/api/ebazaar/getdatampoe", { tradeshopid }, token),
      fetchDataFromColaAPI(
        "/api/ebazaar/getdataprinting",
        { tradeshopid },
        token
      ),
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
    console.error("Cola integration product list get error:", error);
    return res.status(StatusCodes.BAD_REQUEST).send({ status: "failure" });
  }
});

export { router as colaDashboardRouter };
