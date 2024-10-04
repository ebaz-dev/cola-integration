import express, { Request, Response } from "express";
import axios from "axios";
import { StatusCodes } from "http-status-codes";

const router = express.Router();

const { COLA_API, COLA_USERNAME, COLA_PASSWORD } = process.env;

router.get("/profile-data", async (req: Request, res: Response) => {
  try {
    const { tradeshopid } = req.query;

    if (!tradeshopid) {
      return res.status(StatusCodes.BAD_REQUEST).send({ status: "failure", message: "tradeshopid is required" });
    }

    const tokenResponse = await axios.post(COLA_API! + "/api/tokenbazaar", {
      username: COLA_USERNAME!,
      pass: COLA_PASSWORD!,
    });

    if (!tokenResponse?.data?.token) {
      throw new Error("Failed to retrieve token from Cola API.");
    }

    const token = tokenResponse.data.token;

    const profileResponse = await axios.post(
      COLA_API! + "/api/ebazaar/getdataprofile",
      { tradeshopid },
      {
        headers: { Authorization: `Bearer ${token}` },
        maxBodyLength: Infinity,
      }
    );

    const profileData = profileResponse?.data?.data ?? [];

    return res.status(StatusCodes.OK).send({ data: profileData });
  } catch (error: any) {
    if (error.response?.data?.err_msg === "no data") {
      return res.status(StatusCodes.NOT_FOUND).send({ data: [] });
    }
    console.error("Cola integration product list get error:", error);
    return res.status(StatusCodes.BAD_REQUEST).send({ status: "failure", message: error.message });
  }
});

export { router as colaProfileRouter };