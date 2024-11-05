import { HoldingSupplierCodes, Merchant } from "@ebazdev/customer";
import { Types } from "mongoose";
import { BaseAPIClient } from "./cola-api-client";

const colaClient = new BaseAPIClient();

const checkMerchantDebt = async (merchantId: string) => {
  const { COLA_API_URL } =
    process.env.NODE_ENV === "development" ? process.env : process.env;

  if (!COLA_API_URL) {
    throw new Error("Send cola order: Cola credentials are missing.");
  }

  const merchant = await Merchant.findById(new Types.ObjectId(merchantId));

  if (!merchant) {
    console.log("Merchant not found");
    throw new Error("Merchant not found");
  }

  const tradeshop = merchant.tradeShops?.find(
    (ts: any) => ts.holdingKey === HoldingSupplierCodes.CocaCola
  );

  if (!tradeshop) {
    console.log("Tradeshop not found");
    throw new Error("Tradeshop not found");
  }

  const profileData = await colaClient.post("/api/ebazaar/getdataprofile", {
    tradeshopid: tradeshop.tsId,
  });
  if (!profileData.data || !profileData.data.data[0]) {
    throw new Error("Get profile data: error");
  }
  const merchantProfile = profileData.data.data[0];

  const paymentData = await colaClient.post("/api/ebazaar/getdatapayment", {
    tradeshopid: tradeshop.tsId,
  });

  if (!paymentData.data || !paymentData.data.data[0].orderno) {
    throw new Error("Get payment data: error");
  }

  const merchantPayments = paymentData.data.data;
  let debts: any = [];

  merchantPayments.map((p: any) => {
    if (p.amount > p.payamount) {
      const invoiceDate = new Date(p.invoicedate);
      const today = new Date();
      const payDate = new Date(
        invoiceDate.setDate(invoiceDate.getDate() + merchantProfile.agingday)
      );
      if (today > payDate) {
        debts.push(p);
      }
    }
  });

  return {
    profile: merchantProfile,
    payments: merchantPayments,
    debts,
  };
};

export { checkMerchantDebt };
