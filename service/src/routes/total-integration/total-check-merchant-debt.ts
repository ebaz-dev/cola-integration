import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

const router = express.Router();

router.get("/total/merchant/debt", async (req: Request, res: Response) => {
  try {
    return res.status(StatusCodes.OK).send({ data: {} });
  } catch (error) {
    console.log("err", error);
    return res.status(StatusCodes.BAD_REQUEST).send({
      status: "failure",
    });
  }
});

export { router as totalMerchantDebtRouter };
