import express from "express";
import {
  addProduct,
  listProducts,
  removeProduct,
  singleProduct,
  getAllProducts,
  updateProduct,
} from "../controllers/productController.js";
import upload from "../middleware/multer.js";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/auth.js";
import productModel from "../models/productModel.js";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

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
productRouter.post(
  "/update/:id",
  adminAuth,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  updateProduct
);
productRouter.get("/:id", adminAuth, async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, product });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ success: false, message: "Error fetching product" });
  }
});

// Add this route to test Cloudinary configuration
productRouter.get("/test-cloudinary", adminAuth, async (req, res) => {
  try {
    // Check if Cloudinary is configured
    const cloudinaryConfig = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "Set" : "Not set",
      api_key: process.env.CLOUDINARY_API_KEY ? "Set" : "Not set",
      api_secret: process.env.CLOUDINARY_API_SECRET ? "Set" : "Not set",
    };

    res.json({
      success: true,
      message: "Cloudinary configuration check",
      config: cloudinaryConfig,
      uploadsDir: path.join(process.cwd(), "uploads"),
      uploadsExists: fs.existsSync(path.join(process.cwd(), "uploads")),
    });
  } catch (error) {
    console.error("Error testing Cloudinary:", error);
    res
      .status(500)
      .json({ success: false, message: "Error testing Cloudinary" });
  }
});

// Add this route to test Cloudinary directly
productRouter.get("/test-cloudinary-direct", adminAuth, async (req, res) => {
  try {
    // Create a simple string to upload
    const testData =
      "data:text/plain;base64," +
      Buffer.from("Test data from API").toString("base64");

    console.log("Testing direct Cloudinary upload from API...");
    const result = await cloudinary.uploader.upload(testData, {
      folder: "test",
      resource_type: "raw",
    });

    res.json({
      success: true,
      message: "Cloudinary upload successful",
      result: {
        public_id: result.public_id,
        url: result.url,
        secure_url: result.secure_url,
      },
    });
  } catch (error) {
    console.error("Error testing Cloudinary from API:", error);
    res.status(500).json({
      success: false,
      message: "Error testing Cloudinary",
      error: error.message,
    });
  }
});

export default productRouter;
