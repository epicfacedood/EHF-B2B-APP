// Placing orders using the COD method

import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import stripe from "../config/stripe.js";

//global variables
const currency = "sgd";
const deliveryCharge = 10;
const GST_RATE = 0.09; // 9% GST

const generateOrderId = () => {
  // Generate a unique order ID - you can customize this format
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORD-${timestamp}-${random}`;
};

const placeOrder = async (req, res) => {
  try {
    const { items, customerInfo, paymentMethod } = req.body;

    const orderId = generateOrderId();
    const now = new Date();

    // Calculate subtotal of all items
    const subtotalPrice = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const gstAmount = subtotalPrice * GST_RATE;
    const totalPrice = subtotalPrice + gstAmount;

    // Create an order document for each item
    const orderPromises = items.map((item) => {
      const orderData = {
        orderId,
        date: now,
        time: now.toLocaleTimeString(),
        customerName: customerInfo.name,
        customerId: req.user._id, // Assuming this comes from auth middleware
        productName: item.itemName,
        pcode: item.pcode,
        uom: item.uom,
        quantity: item.quantity,
        unitPrice: item.price,
        orderPrice: item.price * item.quantity,
        subtotalPrice,
        totalPrice,
        email: customerInfo.email,
        phone: customerInfo.phone,
        company: customerInfo.company,
        address: customerInfo.address,
        postalCode: customerInfo.postalCode,
        remarks: customerInfo.remarks,
        paymentMethod,
        payment: paymentMethod === "COD" ? false : false,
      };

      return new orderModel(orderData).save();
    });

    await Promise.all(orderPromises);

    // Clear user's cart
    await userModel.findByIdAndUpdate(req.user._id, { cartData: {} });

    res.json({
      success: true,
      message: "Order Placed",
      orderId,
      subtotalPrice,
      totalPrice,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const placeOrderStripe = async (req, res) => {
  try {
    const { items, customerInfo } = req.body;
    const { origin } = req.headers;

    const orderId = generateOrderId();
    const now = new Date();

    const subtotalPrice = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const gstAmount = subtotalPrice * GST_RATE;
    const totalPrice = subtotalPrice + gstAmount;

    // Create order documents
    const orderPromises = items.map((item) => {
      const orderData = {
        orderId,
        date: now,
        time: now.toLocaleTimeString(),
        customerName: customerInfo.name,
        customerId: req.user._id,
        productName: item.itemName,
        pcode: item.pcode,
        uom: item.uom,
        quantity: item.quantity,
        unitPrice: item.price,
        orderPrice: item.price * item.quantity,
        subtotalPrice,
        totalPrice,
        email: customerInfo.email,
        phone: customerInfo.phone,
        company: customerInfo.company,
        address: customerInfo.address,
        postalCode: customerInfo.postalCode,
        remarks: customerInfo.remarks,
        paymentMethod: "Stripe",
        payment: false,
      };

      return new orderModel(orderData).save();
    });

    await Promise.all(orderPromises);

    // Create Stripe session
    const line_items = items.map((item) => ({
      price_data: {
        currency: currency,
        product_data: {
          name: item.itemName,
        },
        unit_amount: Math.round(item.price * 100), // Stripe expects amounts in cents
      },
      quantity: item.quantity,
    }));

    // Add GST as a separate line item
    line_items.push({
      price_data: {
        currency: currency,
        product_data: {
          name: "GST (9%)",
        },
        unit_amount: Math.round(gstAmount * 100),
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      success_url: `${origin}/verify?success=true&orderId=${orderId}`,
      cancel_url: `${origin}/verify?success=false&orderId=${orderId}`,
      line_items,
      mode: "payment",
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// All orders data for admin panel
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//user order data for frontend
const userOrders = async (req, res) => {
  try {
    const { userId } = req.body;
    const orders = await orderModel.find({ userId });
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//Verify Stripe

const verifyStripe = async (req, res) => {
  const { orderId, success, userId } = req.body;

  try {
    if (success === "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
      res.json({ success: true });
    } else {
      await orderModel.findByIdAndDelete(orderId, { payment: false });
      res.json({ success: false });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//update order status from admin panel
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    await orderModel.findByIdAndUpdate(orderId, { status });
    res.json({ success: true, message: "status is updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  placeOrder,
  placeOrderStripe,
  allOrders,
  userOrders,
  updateStatus,
  verifyStripe,
};
