import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  pcode: { type: String, required: true }, //added pcode
  cartonQuantity: { type: String, required: true }, //added cartonquant
  unitPrice: { type: Number, required: true }, //added unitprice
  uom: { type: String, required: true }, //added uom
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: Array, required: false },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  sizes: { type: Array, required: true },
  bestseller: { type: Boolean },
  date: { type: Number, required: true },
});

const productModel =
  mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;
