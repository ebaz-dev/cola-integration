import { HoldingSupplierCodes, Merchant } from "@ebazdev/customer";
import { Order, PaymentMethods } from "@ebazdev/order";
import axios from "axios";
import { getColaToken } from "./get-token";
import moment from "moment";
import { CustomError, NotFoundError } from "@ebazdev/core";
import { Types } from "mongoose";



const sendOrder = async (orderId: string) => {
    try {
        const {
            COLA_API_URL
        } = process.env.NODE_ENV === "development" ? process.env : process.env;

        if (
            !COLA_API_URL
        ) {
            throw new Error("Send cola order: Cola credentials are missing.")
        }


        const order = await Order.findById(new Types.ObjectId(orderId));
        console.log("order", order);

        if (!order) {
            console.log("Order not found");
            throw new Error("Order not found");
        }

        const merchant = await Merchant.findById(order.merchantId);

        console.log("merchant", merchant);

        if (!merchant) {
            console.log("Merchant not found");
            throw new Error("Merchant not found");
        }

        const tradeshop = merchant.tradeShops?.find(ts => ts.holdingKey === HoldingSupplierCodes.CocaCola);

        if (!tradeshop) {
            console.log("Tradeshop not found");
            throw new Error("Tradeshop not found");
        }

        const token = await getColaToken();


        console.log("token", token);
        const getOrderNoData = {
            tradeshopid: Number(tradeshop.tsId),
            deliverydate: moment(order.deliveryDate).format("YYYY-MM-DD"),
            paymenttype: order.paymentMethod === PaymentMethods.Cash ? "Бэлэн" : "QPAY",
            ordertype: "bazaar",
            description: order.orderNo?.toString(),
            yourorderno: `ebazaaror${order.orderNo}`
        };
        console.log("getOrderNoData", getOrderNoData);
        const getOrderNoResponse = await axios.post(
            `${COLA_API_URL}/api/ebazaar/getorderno`,
            getOrderNoData,
            {
                headers: { Authorization: `Bearer ${token}` },
                maxBodyLength: Infinity,
            }
        );


        console.log("data", getOrderNoResponse.data)

        if (!getOrderNoResponse.data || !getOrderNoResponse.data.data[0].orderno) {
            throw new Error("Get order no: error");
        }

        const orderno = getOrderNoResponse.data.data[0].orderno;

        order.thirdPartyId = orderno;

        const orderDetails = order.products.concat(order.giftProducts).map(product => {
            return {
                orderno: orderno,
                productid: product.thirdPartyData[0].productId,
                quantity: product.quantity,
                price: product.price,
                baseprice: product.basePrice
            }
        });

        console.log("orderdetails", orderDetails);

        const res = await axios.post(
            `${COLA_API_URL}/api/ebazaar/orderdetailcreate`,
            orderDetails,
            {
                headers: { Authorization: `Bearer ${token}` },
                maxBodyLength: Infinity,
            }
        );

        console.log("res", res);
        return { colaOrderNo: orderno, orderDetails }
    } catch (error) {
        console.log("err", error)
        throw new Error("Send order: error")
    }
};

export { sendOrder }