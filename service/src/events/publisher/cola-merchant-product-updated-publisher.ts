import { Publisher } from "@ebazdev/core";
import { ColaMerchantProductsUpdated } from "../../shared/events/cola-merchant-products-updated.event";
import { ColaProductSubjects } from "../../shared/events/cola-product-event-subjects";

export class ColaMrechantProductsPublisher extends Publisher<ColaMerchantProductsUpdated> {
  subject: ColaProductSubjects.ColaMerchantProductsUpdated =
    ColaProductSubjects.ColaMerchantProductsUpdated;
}
