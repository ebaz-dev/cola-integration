import { BaseAPIClient } from "./cola-api-client";

const colaClient = new BaseAPIClient();

const colaMerchantPayments = async (tradeshopId: string) => {
  const profileData = await colaClient.post("/api/ebazaar/getdataprofile", {
    tradeshopid: tradeshopId,
  });
  if (!profileData.data || !profileData.data.data[0]) {
    throw new Error("Get profile data: error");
  }
  const merchantProfile = profileData.data.data[0];

  const paymentData = await colaClient.post("/api/ebazaar/getdatapayment", {
    tradeshopid: tradeshopId,
  });

  if (!paymentData.data || !paymentData.data.data[0].orderno) {
    throw new Error("Get payment data: error");
  }

  const merchantPayments = paymentData.data.data;
  let debts: any = [];

  const payments = merchantPayments.map((p: any) => {
    if (p.amount > p.payamount) {
      const invoiceDate = new Date(p.invoicedate);
      const today = new Date();
      const payDate = new Date(
        invoiceDate.setDate(invoiceDate.getDate() + merchantProfile.agingday)
      );

      const diff = today.getTime() - payDate.getTime();
      p.overDays = Math.round(diff / (1000 * 3600 * 24));

      p.overdue = today > payDate;

      if (p.overdue) {
        debts.push(p);
      }
    }
    return p;
  });

  return {
    profile: merchantProfile,
    payments,
    debts,
  };
};

export { colaMerchantPayments };
