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
  notes: {
    type: String,
    default: "",
  },
});

// Add pre-save hook for debugging
priceListItemSchema.pre("save", function (next) {
  console.log("Saving price list item:", this);
  next();
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

// Add pre-save hook for debugging
priceListSchema.pre("save", function (next) {
  console.log("Saving price list for customer:", this.customerId);
  console.log("Number of items:", this.items.length);
  next();
});

const PriceList = mongoose.model("PriceList", priceListSchema);

export default PriceList;
