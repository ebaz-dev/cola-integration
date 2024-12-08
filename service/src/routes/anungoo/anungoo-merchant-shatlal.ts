import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AnungooAPIClient } from "../../utils/apiclients/anungoo-api-client";

const router = express.Router();

router.get("/anungoo/merchant-shatlal", async (req: Request, res: Response) => {
  try {
    const tradeshopid = req.query.tradeshopid as string;

    if (!tradeshopid) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: "tradeshopid is required",
      });
    }

    const productsResponse = await AnungooAPIClient.getClient().post(
      `/api/ebazaar/productremains`,
      {
        tradeshopid,
      }
    );

    const merchantShatlal = productsResponse?.data.shatlal || [];
    const total = merchantShatlal.length;

    res.status(StatusCodes.OK).send({
      data: merchantShatlal,
      total: total,
      totalPages: 1,
      currentPage: 1,
    });
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return res.status(StatusCodes.OK).send({
        data: [],
        total: 0,
        totalPages: 1,
        currentPage: 1,
      });
    } else {
      console.error(
        "Bas integration anungoo merchant shatlal get error:",
        error
      );

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
        message: "Something went wrong.",
      });
    }
  }
});

export { router as anungooMerchantShatlalRouter };
