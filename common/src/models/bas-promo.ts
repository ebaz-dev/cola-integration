import { ObjectId } from "mongoose";

interface giftProductsPackage {
  minamount: number;
  packageid: number;
  productid: string;
  giftQnt: number;
}

interface basPromoMain {
  supplierId: ObjectId;
  promoname: string;
  promoid: number;
  promono: string;
  startdate: string;
  enddate: string;
  tresholdamount: number;
  tresholdquantity: number;
  promopercent: number;
  giftquantity: number;
  isactive: boolean;
  promotypeid: number;
  promotype: string;
  promotypebycode: string;
  ThisPage?: string;
  TotalPages?: string;
  products?: ObjectId[];
  giftProducts?: ObjectId[];
  giftProductPackage?: giftProductsPackage;
  tradeshops?: number[];
  thirdPartyProducts?: number[];
  thirdPartyGiftProducts?: number[];
  thirdPartyGiftProductPackage?: basPromoGiftProductsPackage;
  thirdPartyTradeshops?: number[];
}

interface basPromoProducts {
  PromoID: number;
  Products: number[];
}

interface basPromoGiftProducts {
  PromoID: number;
  GiftProducts: number[];
}

interface basPromoGiftProductsPackage {
  promoid: number;
  minamount: number;
  packageid: number;
  productid: number;
  giftQnt: number;
}

interface basPromoTradeshops {
  PromoID: number;
  Tradeshops: number[];
}

export {
  giftProductsPackage,
  basPromoMain,
  basPromoProducts,
  basPromoGiftProducts,
  basPromoGiftProductsPackage,
  basPromoTradeshops,
};
