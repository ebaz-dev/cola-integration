import { ObjectId } from "mongoose";

interface Promo {
  promoid: number;
  promoname: string;
  startdate: string;
  enddate: string;
  tresholdquantity: number;
  promopercent: number;
  giftquantity: number;
  isactive: boolean;
  promotypeid: number;
  promotype: string;
  promotypebycode: string;
  colaProducts?: number[];
  colaGiftProducts?: number[];
  colaTradeshops?: number[];
  products: ObjectId[];
  giftProducts: ObjectId[];
  tradeshops: string[];
}

interface ColaPromoProduct {
  PromoID: number;
  Products: number[];
}

interface ColaPromoGiftProduct {
  PromoID: number;
  Products: number[];
}

interface ColaPromoTradeshops {
  PromoID: number;
  Tradeshops: number[];
}

export { Promo, ColaPromoProduct, ColaPromoGiftProduct, ColaPromoTradeshops };
