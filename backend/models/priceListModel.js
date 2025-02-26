import mongoose from "mongoose";

const priceListItemSchema = new mongoose.Schema({
  pcode: {
    type: String,
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  uom: {
    type: String,
    required: true,
  },
});

const priceListSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    items: [priceListItemSchema],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index for faster lookups
priceListSchema.index({ customerId: 1, "items.pcode": 1 });

// Method to find a specific product price for a customer
priceListSchema.methods.findProductPrice = function (pcode) {
  return this.items.find((item) => item.pcode === pcode);
};

const PriceList = mongoose.model("PriceList", priceListSchema);

export default PriceList;
