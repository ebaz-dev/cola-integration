import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AnungooAPIClient } from "../../utils/apiclients/anungoo-api-client";
import { BadRequestError, NotFoundError } from "@ebazdev/core";
import { Merchant } from "@ebazdev/customer";

const router = express.Router();

router.get("/anungoo/profile-data", async (req: Request, res: Response) => {
  try {
    const { tradeshopId } = req.query;

    if (!tradeshopId) {
      throw new BadRequestError("TradeshopId required");
    }

    const merchant = await Merchant.findById(tradeshopId);

    if (!merchant) {
      throw new BadRequestError("Merchant not found");
    }

    if (!merchant.tradeShops) {
      throw new BadRequestError("Anungoo merchant not registered");
    }

    const integrationData = merchant.tradeShops;
    const anungooTsId = integrationData.find(
      (item) => item.holdingKey === "AG"
    )?.tsId;

    if (!anungooTsId) {
      throw new BadRequestError("Anungoo merchant not registered");
    }

    const profileResponse = await AnungooAPIClient.getClient().post(
      "/api/ebazaar/getdataprofile",
      { tradeshopid: parseInt(anungooTsId) }
    );

    const profileData = profileResponse?.data?.data ?? [];

    const filteredData = profileData.filter(
      (item: any) => item.htcompany === "AG"
    );

    if (filteredData.length === 0) {
      return res.status(StatusCodes.OK).send({ message: "no data", data: [] });
    }

    return res
      .status(StatusCodes.OK)
      .send({ message: "succes", data: filteredData });
  } catch (error: any) {
    if (error.response?.data?.err_msg === "no data") {
      throw new NotFoundError();
    } else if (
      error instanceof BadRequestError ||
      error instanceof NotFoundError
    ) {
      throw error;
    } else {
      console.error("Bas integration anungoo profile get error:", error);
      throw new BadRequestError("Something went wrong");
    }
  }
});

export { router as anungooProfileRouter };
