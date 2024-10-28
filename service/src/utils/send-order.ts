import { HoldingSupplierCodes, Merchant, Supplier } from "@ebazdev/customer";
import {
  Order,
  OrderStatus,
  OrderThirdPartyDataDoc,
  PaymentMethods,
} from "@ebazdev/order";
import axios from "axios";
import { getColaToken } from "./get-token";
import moment from "moment";
import { Types } from "mongoose";

const sendOrder = async (orderId: string) => {
  try {
    const { COLA_API_URL } =
      process.env.NODE_ENV === "development" ? process.env : process.env;

    if (!COLA_API_URL) {
      throw new Error("Send cola order: Cola credentials are missing.");
    }

    const order = await Order.findById(new Types.ObjectId(orderId));

    if (!order) {
      console.log("Order not found");
      throw new Error("Order not found");
    }

    if (
      order.status === OrderStatus.Created &&
      order.paymentMethod != PaymentMethods.Cash
    ) {
      return { order };
    }
    const supplier = await Supplier.findById(order.supplierId);

    if (!supplier) {
      console.log("Supplier not found");
      throw new Error("Supplier not found");
    }

    if (supplier.holdingKey !== HoldingSupplierCodes.CocaCola) {
      console.log("Supplier is not MCSCC");
      throw new Error("Supplier is not MCSCC");
    }

    const merchant = await Merchant.findById(order.merchantId);

    console.log("merchant", merchant);

    if (!merchant) {
      console.log("Merchant not found");
      throw new Error("Merchant not found");
    }

    const tradeshop = merchant.tradeShops?.find(
      (ts) => ts.holdingKey === HoldingSupplierCodes.CocaCola
    );

    if (!tradeshop) {
      console.log("Tradeshop not found");
      throw new Error("Tradeshop not found");
    }

    const token = await getColaToken();

    const getOrderNoData = {
      tradeshopid: Number(tradeshop.tsId),
      deliverydate: moment(order.deliveryDate).format("YYYY-MM-DD"),
      paymenttype:
        order.paymentMethod === PaymentMethods.Cash ? "Бэлэн" : "QPAY",
      ordertype: "bazaar",
      description: order.orderNo?.toString(),
      yourorderno: `${order.orderNo}`,
    };
    if (!order.thirdPartyId) {
      const getOrderNoResponse = await axios.post(
        `${COLA_API_URL}/api/ebazaar/getorderno`,
        getOrderNoData,
        {
          headers: { Authorization: `Bearer ${token}` },
          maxBodyLength: Infinity,
        }
      );
      if (!order.thirdPartyData) {
        order.thirdPartyData = <OrderThirdPartyDataDoc>{
          response: [getOrderNoResponse],
        };
      } else if (!order.thirdPartyData.response) {
        order.thirdPartyData.response = [getOrderNoResponse];
      } else {
        order.thirdPartyData.response.push(getOrderNoResponse);
      }
      order.thirdPartyData.updatedAt = new Date();
      if (
        !getOrderNoResponse.data ||
        !getOrderNoResponse.data.data[0].orderno
      ) {
        await order.save();
        throw new Error("Get order no: error");
      }

      order.thirdPartyData.thirdPartyId =
        getOrderNoResponse.data.data[0].orderno;

      order.thirdPartyId = getOrderNoResponse.data.data[0].orderno;
    }

    const orderDetails = order.products
      .concat(order.giftProducts)
      .map((product) => {
        return {
          orderno: order.thirdPartyId,
          productid: Number(product.thirdPartyData[0].productId),
          quantity: Number(product.quantity) + Number(product.giftQuantity),
          price: Number(product.price),
          baseprice: Number(product.basePrice),
          promoid: product.promoId || 0,
        };
      });

    const res = await axios.post(
      `${COLA_API_URL}/api/ebazaar/orderdetailcreate`,
      orderDetails,
      {
        headers: { Authorization: `Bearer ${token}` },
        maxBodyLength: Infinity,
      }
    );
    order.thirdPartyData.response.push(res);
    await order.save();
    return { colaOrderNo: order.thirdPartyId, orderDetails };
  } catch (error) {
    console.log("err", error);
    throw new Error("Send order: error");
  }
};

export { sendOrder };
