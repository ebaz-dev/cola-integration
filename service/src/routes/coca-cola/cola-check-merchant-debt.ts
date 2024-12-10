import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { checkMerchantDebt } from "../../utils/merchant-debt";

const router = express.Router();

router.get("/cola/merchant/debt", async (req: Request, res: Response) => {
  try {
    const data = await checkMerchantDebt(req.query.merchantId as string);

    return res.status(StatusCodes.OK).send({ data });
  } catch (error) {
    console.log("err", error);
    return res.status(StatusCodes.BAD_REQUEST).send({
      status: "failure",
    });
  }
});

export { router as colaMerchantDebtRouter };
