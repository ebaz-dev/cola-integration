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

interface promoProducts {
  PromoID: number;
  Products: number[];
}

interface giftProducts {
  PromoID: number;
  GiftProducts: number[];
}

interface promoTradeshops {
  PromoID: number;
  Tradeshops: number[];
}

export { Promo, promoProducts, giftProducts, promoTradeshops };
