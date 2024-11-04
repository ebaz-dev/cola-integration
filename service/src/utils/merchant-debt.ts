import { HoldingSupplierCodes, Merchant } from "@ebazdev/customer";
import axios from "axios";
import { getColaToken } from "./get-token";
import moment from "moment";
import { Types } from "mongoose";

const checkMerchantDebt = async (merchantId: string) => {
  try {
    const { COLA_API_URL } =
      process.env.NODE_ENV === "development" ? process.env : process.env;

    if (!COLA_API_URL) {
      throw new Error("Send cola order: Cola credentials are missing.");
    }

    const merchant = await Merchant.findById(new Types.ObjectId(merchantId));

    console.log("merchant", merchant);

    if (!merchant) {
      console.log("Merchant not found");
      throw new Error("Merchant not found");
    }

    const tradeshop = merchant.tradeShops?.find(
      (ts) => ts.holdingKey === HoldingSupplierCodes.CocaCola
    );

    if (!tradeshop) {
      console.log("Tradeshop not found");
      throw new Error("Tradeshop not found");
    }

    const token = await getColaToken();

    console.log("tradeshop", tradeshop);
    const profileData = await axios.post(
      `${COLA_API_URL}/api/ebazaar/getdataprofile`,
      {
        tradeshopid: tradeshop.tsId,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        maxBodyLength: Infinity,
      }
    );
    if (!profileData.data || !profileData.data.data[0]) {
      throw new Error("Get profile data: error");
    }
    const merchantProfile = profileData.data.data[0];

    console.log("profile", profileData.data);

    const paymentData = await axios.post(
      `${COLA_API_URL}/api/ebazaar/getdatapayment`,
      {
        tradeshopid: tradeshop.tsId,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        maxBodyLength: Infinity,
      }
    );

    if (!paymentData.data || !paymentData.data.data[0].orderno) {
      throw new Error("Get payment data: error");
    }

    const merchantPayments = paymentData.data.data;

    console.log("payment", paymentData.data);
    return { profileData: profileData.data, paymentData: paymentData.data };
  } catch (error) {
    console.log("err", error);
    throw new Error("Send order: error");
  }
};

export { checkMerchantDebt };
