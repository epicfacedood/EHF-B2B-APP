import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    pcode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    baseUnit: {
      type: String,
      required: true,
      trim: true,
    },
    packagingSize: {
      // represents 'packaging/size' from Excel
      type: String,
      required: true,
      trim: true,
    },
    uom: {
      type: String,
      required: true,
      trim: true,
    },
    uoms: {
      type: String,
      required: false,
    },
    image: { type: Array, required: false },
    category: { type: String, required: false },
    date: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

const productModel =
  mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;
