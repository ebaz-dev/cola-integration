import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendOrder } from "../../utils/send-order";

const router = express.Router();

router.post("/cola/order/send", async (req: Request, res: Response) => {
    try {
        const { orderId } = req.body;
        await sendOrder(orderId);

        return res.status(StatusCodes.OK).send({ status: "success" });
    } catch (error) {
        return res.status(StatusCodes.BAD_REQUEST).send({
            satus: "failure",
        });
    }
});

export { router as colaOrderSendRouter };
