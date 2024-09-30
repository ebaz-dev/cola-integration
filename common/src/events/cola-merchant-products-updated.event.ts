import { ColaProductSubjects } from "./cola-product-event-subjects";
import { IntegrationCustomerIds } from "../models/integration-customer-ids";
import mongoose from "mongoose";

export interface ColaMerchantProductsUpdated {
  subject: ColaProductSubjects.ColaMerchantProductsUpdated;

  data: {
    merchantId: mongoose.Types.ObjectId;
    customerId: IntegrationCustomerIds.cocaCola;
    activeList: string[];
    inActiveList: string[];
  };
}
