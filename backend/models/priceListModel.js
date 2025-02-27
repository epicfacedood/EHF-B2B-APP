import mongoose from "mongoose";

const priceListItemSchema = new mongoose.Schema({
  pcode: {
    type: String,
    required: true,
  },
  itemName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

const priceListSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: true,
      unique: true,
    },
    customerName: {
      type: String,
    },
    items: [priceListItemSchema],
  },
  { timestamps: true }
);

const PriceList = mongoose.model("PriceList", priceListSchema);

export default PriceList;
