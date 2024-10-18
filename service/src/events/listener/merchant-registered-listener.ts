import { Message } from "node-nats-streaming";
import { Listener } from "@ebazdev/core";
import { queueGroupName } from "./queue-group-name";
import {
  SupplierCodeAddedEvent,
  CustomerEventSubjects,
} from "@ebazdev/customer";
import { BaseAPIClient } from "../../shared/utils/cola-api-client";
import { Product } from "@ebazdev/product";
import { ColaMerchantProductUpdatedEventPublisher } from "../publisher/cola-merchant-product-updated-publisher";
import { natsWrapper } from "../../nats-wrapper";
import { Types } from "mongoose";

const colaClient = new BaseAPIClient();
const colaCustomerId = process.env.COCA_COLA_CUSTOMER_ID;

interface RegisteredProduct {
  productId: string;
  thirdPartyId: string | null;
}

export class MerchantCodeRegisteredListener extends Listener<SupplierCodeAddedEvent> {
  readonly subject = CustomerEventSubjects.SupplierCodeAdded;
  queueGroupName = queueGroupName;

  async onMessage(data: SupplierCodeAddedEvent["data"], msg: Message) {
    try {
      const { merchantId, holdingKey, tsId } = data;

      if (holdingKey === "MCSCC") {
        const productResponse = (
          await colaClient.post("/api/ebazaar/productremains", {
            tradeshopid: tsId,
          })
        ).data;

        const activeProducts = productResponse.data;

        if (activeProducts.length === 0) {
          msg.ack();
          return;
        }

        const activeProductIds = activeProducts.map(
          (product: any) => product.productid
        );

        const products = await Product.find({
          customerId: colaCustomerId,
        }).lean();

        const registeredProducts: RegisteredProduct[] = products.map((product) => ({
          productId: product._id.toString(),
          thirdPartyId:
            product.thirdPartyData?.find((data: any) =>
              data.customerId.equals(colaCustomerId)
            )?.productId || null,
        }));

        const activeProductList: string[] = registeredProducts
            .filter(({ thirdPartyId }) => activeProductIds.includes(thirdPartyId))
            .map(({ productId }) => productId);

        await new ColaMerchantProductUpdatedEventPublisher(
          natsWrapper.client
        ).publish({
          merchantId: new Types.ObjectId(merchantId),
          customerId: new Types.ObjectId(colaCustomerId),
          activeList: activeProductList,
          inActiveList: [],
        });

        msg.ack();
      }
    } catch (error) {
      console.error("Error processing MerchantCodeRegisteredListener:", error);
    }
  }
}
