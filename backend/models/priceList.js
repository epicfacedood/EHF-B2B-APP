const mongoose = require("mongoose");

const priceListSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    productId: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index for faster lookups
priceListSchema.index({ customerId: 1, productId: 1 });

module.exports = mongoose.model("PriceList", priceListSchema);
