import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

dotenv.config();

const { COLA_INBOUND_ACCESS_TOKEN_SECRET } = process.env;

const thirdPartyAuthenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .send({ status: "failed", message: "Authentication failed." });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, COLA_INBOUND_ACCESS_TOKEN_SECRET!, (err, decoded) => {
    if (err) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .send({ status: "failed", message: "Invalid token" });
    }

    next();
  });
};

export { thirdPartyAuthenticate };
