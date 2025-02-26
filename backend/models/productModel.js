import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    // Core product identification
    pcode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    // Unit of measure information
    baseUnit: {
      type: String,
      required: true,
      trim: true,
    },
    packagingSize: {
      type: String,
      required: false, // Changed to false since some items have empty packaging size
      default: "",
      trim: true,
    },
    uomOptions: [
      {
        code: {
          type: String,
          required: true,
        },
        qtyPerUOM: {
          type: Number,
          required: true,
          default: 1,
        },
      },
    ],

    // Display and categorization
    bestseller: {
      type: Boolean,
      default: false,
    },
    image: {
      type: Array,
      default: [],
    },

    // Legacy fields - kept for backward compatibility but marked as optional
    price: {
      type: Number,
      required: false,
      default: 0,
    },
    uom: {
      type: String,
      required: false,
      trim: true,
    },
    uoms: {
      type: String,
      required: false,
    },
    category: {
      type: String,
      required: false,
    },
    date: {
      type: Number,
      required: true,
      default: () => Date.now(),
    },

    // Deprecated field - will be removed in future
    baseUOM: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Add helpful indexes
productSchema.index({ itemName: "text" });

const productModel =
  mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;
