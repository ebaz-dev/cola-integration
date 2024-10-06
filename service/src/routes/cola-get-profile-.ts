import express, { Request, Response } from "express";
import axios from "axios";
import { StatusCodes } from "http-status-codes";
import { BaseAPIClient } from "../shared/utils/cola-api-client";
import { BadRequestError, NotFoundError } from "@ebazdev/core";

const router = express.Router();
const colaClient = new BaseAPIClient();

router.get("/profile-data", async (req: Request, res: Response) => {
  try {
    const { tradeshopId } = req.query;

    if (!tradeshopId) {
      throw new BadRequestError("tradeshopId required");
    }

    const profileResponse = await colaClient.post(
      "/api/ebazaar/getdataprofile",
      { tradeshopid: tradeshopId }
    );

    const profileData = profileResponse?.data?.data ?? [];

    if (profileData.length === 0) {
      throw new NotFoundError();
    }

    return res.status(StatusCodes.OK).send({ data: profileData });
  } catch (error: any) {
    if (error.response?.data?.err_msg === "no data") {
      throw new NotFoundError();
    } else if (
      error instanceof BadRequestError ||
      error instanceof NotFoundError
    ) {
      throw error;
    } else {
      console.error("Cola integration product list get error:", error);
      new BadRequestError("Something went wrong");
    }
  }
});

export { router as colaProfileRouter };
