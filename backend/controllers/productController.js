//function for add product

import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (file) => {
  try {
    console.log("Uploading file to Cloudinary:", file.path);
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "products", // All product images will go to this folder
    });
    console.log("Cloudinary upload result:", result);
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
};

const addProduct = async (req, res) => {
  try {
    const {
      itemName,
      pcode,
      price,
      baseUnit,
      packagingSize,
      uom,
      uoms,
      category,
      bestseller,
    } = req.body;

    // Handle image uploads
    const images = [];
    const imageFiles = [
      req.files?.image1?.[0],
      req.files?.image2?.[0],
      req.files?.image3?.[0],
      req.files?.image4?.[0],
    ].filter(Boolean);

    // Debug logs
    console.log("Files received:", req.files);
    console.log("Image files to process:", imageFiles);

    // Upload all images to Cloudinary
    for (const file of imageFiles) {
      const imageUrl = await uploadToCloudinary(file);
      if (imageUrl) {
        console.log("Added image URL to product:", imageUrl);
        images.push(imageUrl);
      }
    }

    // Debug logs for image upload
    console.log("Files received:", req.files);
    console.log("Image files to process:", imageFiles);
    console.log("Cloudinary URLs:", images);

    const productData = {
      itemName,
      pcode,
      price: Number(price),
      baseUnit,
      packagingSize,
      uom,
      uoms,
      category,
      bestseller: bestseller === "true",
      image: images,
      date: Date.now(),
    };

    console.log("Final product data being saved:", productData);

    const product = new productModel(productData);
    await product.save();

    // Log the saved product
    console.log("Saved product:", product);

    res.json({ success: true, message: "Product added successfully" });
  } catch (error) {
    console.error("Error adding product:", error);
    res.json({ success: false, message: error.message });
  }
};

// Helper function to convert string to array
const parseUoms = (uomsString) => {
  if (!uomsString) return [];
  if (Array.isArray(uomsString)) return uomsString;
  return uomsString.split(",").map((uom) => uom.trim());
};

const listProducts = async (req, res) => {
  try {
    const products = await productModel.find({}).sort({ itemName: 1 });

    res.json({ success: true, products });
  } catch (error) {
    console.error("Error listing products:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching products" });
  }
};

const removeProduct = async (req, res) => {
  await productModel.findByIdAndDelete(req.body.id);
  res.json({ success: true, message: "Product Removed" });
};

const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productModel.findById(productId);
    if (product) {
      const transformedProduct = {
        ...product.toObject(),
        uoms: parseUoms(product.uoms),
      };
      res.json({ success: true, product: transformedProduct });
    } else {
      res.json({ success: false, message: "Product not found" });
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    res.json({ success: false, message: error.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await productModel.find({}).sort({ itemName: 1 });
    // Transform products to include parsed uoms
    const transformedProducts = products.map((product) => ({
      ...product.toObject(),
      uoms: parseUoms(product.uoms),
    }));
    res.json({ success: true, products: transformedProducts });
  } catch (error) {
    console.error("Error getting products:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching products" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      itemName,
      pcode,
      price,
      baseUnit,
      packagingSize,
      uom,
      uoms,
      category,
      bestseller,
    } = req.body;

    // Handle image files
    const image1 = req.files?.image1?.[0];
    const image2 = req.files?.image2?.[0];
    const image3 = req.files?.image3?.[0];
    const image4 = req.files?.image4?.[0];

    // Get existing product
    const existingProduct = await productModel.findById(id);
    if (!existingProduct) {
      return res.json({ success: false, message: "Product not found" });
    }

    // Prepare image array
    const images = [...(existingProduct.image || [])];

    // Upload new images if provided
    if (image1) {
      const imageUrl = await uploadToCloudinary(image1);
      if (imageUrl) images[0] = imageUrl;
    }
    if (image2) {
      const imageUrl = await uploadToCloudinary(image2);
      if (imageUrl) images[1] = imageUrl;
    }
    if (image3) {
      const imageUrl = await uploadToCloudinary(image3);
      if (imageUrl) images[2] = imageUrl;
    }
    if (image4) {
      const imageUrl = await uploadToCloudinary(image4);
      if (imageUrl) images[3] = imageUrl;
    }

    // Update product
    const updatedProduct = await productModel.findByIdAndUpdate(
      id,
      {
        itemName,
        pcode,
        price: Number(price),
        baseUnit,
        packagingSize,
        uom,
        uoms,
        category,
        bestseller: bestseller === "true" || bestseller === true,
        image: images.filter(Boolean),
      },
      { new: true }
    );

    res.json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    console.error("Error updating product:", error);
    res.json({ success: false, message: error.message });
  }
};

export {
  addProduct,
  listProducts,
  removeProduct,
  singleProduct,
  getAllProducts,
  updateProduct,
};
