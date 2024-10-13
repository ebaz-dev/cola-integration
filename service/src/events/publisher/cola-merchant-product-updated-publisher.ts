import { Publisher } from "@ebazdev/core";
import { ColaMerchantProductUpdated } from "../../shared/events/cola-merchant-product-updated.event";
import { ColaProductSubjects } from "../../shared/events/cola-product-event-subjects";

export class ColaMerchantProductUpdatedEventPublisher extends Publisher<ColaMerchantProductUpdated> {
  subject: ColaProductSubjects.ColaMerchantProductUpdated =
    ColaProductSubjects.ColaMerchantProductUpdated;
}
