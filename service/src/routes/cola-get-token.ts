import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const { COLA_OUT_USERNAME, COLA_OUT_PASSWORD, COLA_ACCESS_TOKEN_SECRET } =
  process.env;

router.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (username !== COLA_OUT_USERNAME || password !== COLA_OUT_PASSWORD) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .send({ status: "failed", message: "Invalid credentials" });
  }

  const payload = {
    username: "cola-integrated-user",
  };

  const accessToken = jwt.sign(payload, COLA_ACCESS_TOKEN_SECRET!, {
    expiresIn: "15m",
  });

  return res.status(StatusCodes.OK).json({ token: accessToken });
});

export { router as colaLoginRouter };
