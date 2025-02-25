import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    deliveryDate: { type: Date, required: true },
    customerName: { type: String, required: true },
    customerId: { type: String, required: true },
    productName: { type: String, required: true },
    pcode: { type: String, required: true },
    uom: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    orderPrice: { type: Number, required: true },
    subtotalPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    company: { type: String },
    address: { type: String, required: true },
    postalCode: { type: String, required: true },
    remarks: { type: String },
    status: { type: String, default: "Order Placed" },
    paymentMethod: { type: String, required: true },
    payment: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Drop the existing unique index if it exists
mongoose.connection.on("connected", async () => {
  try {
    await mongoose.connection.db.collection("orders").dropIndex("orderId_1");
  } catch (error) {
    // Index might not exist, that's okay
    console.log("No orderId_1 index to drop");
  }
});

// Create a compound index on orderId and productName to ensure unique products within an order
orderSchema.index({ orderId: 1, productName: 1 });

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);
export default orderModel;
