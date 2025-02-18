import express from "express";
import {
  addProduct,
  listProducts,
  removeProduct,
  singleProduct,
  getAllProducts,
} from "../controllers/productController.js";
import upload from "../middleware/multer.js";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/auth.js";
import productModel from "../models/productModel.js";

const productRouter = express.Router();

//the productRouter.post() function in Express is used to define a
//route that listens for HTTP POST requests at a specific path

// Definte route for adding a product
productRouter.post(
  "/add",
  adminAuth, //Middleware for admin authentication
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]), //Middleware for handling file uploads
  addProduct //Controller function to handle adding a product
);
productRouter.post("/remove", adminAuth, removeProduct);
productRouter.post("/single", singleProduct);
productRouter.get("/list", authUser, listProducts);
productRouter.get("/all", authUser, getAllProducts);
productRouter.get("/admin/list", adminAuth, async (req, res) => {
  try {
    const products = await productModel.find().sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    console.error("Error listing products:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching products" });
  }
});

export default productRouter;
