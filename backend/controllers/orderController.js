// Placing orders using the COD method

import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import stripe from "../config/stripe.js";

//global variables
const currency = "sgd";
const deliveryCharge = 10;
const GST_RATE = 0.09; // 9% GST

const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `ORD${timestamp}${random}`;
};

const placeOrder = async (req, res) => {
  try {
    const { items, customerInfo, subtotalPrice, totalPrice } = req.body;

    // Get the user's customerId from the database
    const user = await userModel.findById(req.user._id);
    if (!user) {
      throw new Error("User not found");
    }

    // Generate one orderId for the entire order
    const orderId = generateOrderId();
    const orderDate = new Date();
    const orderTime = orderDate.toLocaleTimeString();

    // Create an order document for each item, but use the same orderId
    const orderPromises = items.map(async (item) => {
      const orderData = {
        orderId, // Same orderId for all items in this order
        date: orderDate,
        time: orderTime,
        deliveryDate: new Date(customerInfo.deliveryDate),
        customerName: customerInfo.name,
        customerId: user.customerId,
        productName: item.itemName,
        pcode: item.pcode,
        uom: item.uom,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        orderPrice: Number(item.orderPrice),
        subtotalPrice: Number(subtotalPrice),
        totalPrice: Number(totalPrice),
        email: customerInfo.email,
        phone: customerInfo.phone,
        company: customerInfo.company || "",
        address: customerInfo.address,
        postalCode: customerInfo.postalCode,
        remarks: customerInfo.remarks || "",
        paymentMethod: "standard",
      };

      // Validate numbers before creating the order
      if (
        isNaN(orderData.quantity) ||
        isNaN(orderData.unitPrice) ||
        isNaN(orderData.orderPrice) ||
        isNaN(orderData.subtotalPrice) ||
        isNaN(orderData.totalPrice)
      ) {
        throw new Error("Invalid number values in order data");
      }

      const newOrder = new orderModel(orderData);
      return newOrder.save();
    });

    await Promise.all(orderPromises);
    await userModel.findByIdAndUpdate(req.user._id, { cartData: {} });

    res.json({
      success: true,
      message: "Order Placed",
      orderId, // Send back the orderId in the response
    });
  } catch (error) {
    console.error("Order placement error:", error);
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
        deliveryDate: new Date(customerInfo.deliveryDate),
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
    // Get user's customerId from the database
    const user = await userModel.findById(req.user._id);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Find all orders for this customer using their customerId
    const orders = await orderModel.find({ customerId: user.customerId });

    // Log for debugging
    console.log("Found orders:", orders);

    res.json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching user orders:", error);
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
