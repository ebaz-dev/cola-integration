import { ColaProductSubjects } from "./cola-product-event-subjects";
import mongoose from "mongoose";

export interface ColaMerchantProductUpdated {
  subject: ColaProductSubjects.ColaMerchantProductUpdated;

  data: {
    merchantId: mongoose.Types.ObjectId;
    customerId: mongoose.Types.ObjectId;
    activeList: string[];
    inActiveList: string[];
  };
}
