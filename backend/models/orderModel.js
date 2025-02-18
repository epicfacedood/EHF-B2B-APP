import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    pcode: { type: String, required: true },
    itemName: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    packagingSize: { type: String, required: true },
    uom: { type: String, required: true },
    uoms: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    items: [orderItemSchema],
    amount: { type: Number, required: true },
    address: { type: Object, required: true },
    status: { type: String, required: true, default: "Order Placed" },
    paymentMethod: { type: String, required: true },
    payment: { type: Boolean, required: true, default: false },
    date: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);
export default orderModel;
