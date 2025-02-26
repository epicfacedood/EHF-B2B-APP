//function for add product

import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";
import fs from "fs";
import path from "path";

// Simplified uploadToCloudinary function
const uploadToCloudinary = async (file) => {
  try {
    console.log(
      "Uploading file to Cloudinary:",
      file.path,
      "Size:",
      file.size,
      "Type:",
      file.mimetype
    );

    // Check if file exists
    if (!fs.existsSync(file.path)) {
      console.error("File does not exist at path:", file.path);
      return null;
    }

    // Log file stats
    const stats = fs.statSync(file.path);
    console.log("File stats:", {
      size: stats.size,
      isFile: stats.isFile(),
      path: file.path,
    });

    // Upload with global configuration
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "products",
      resource_type: "auto",
    });

    console.log("Cloudinary upload successful, URL:", result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    console.error("Error details:", error.message);
    return null;
  }
};

const addProduct = async (req, res) => {
  try {
    const { itemName, pcode, baseUnit, packagingSize, bestseller, uomOptions } =
      req.body;

    // Parse uomOptions from JSON string
    let parsedUomOptions;
    try {
      parsedUomOptions = JSON.parse(uomOptions);
    } catch (error) {
      console.error("Error parsing uomOptions:", error);
      return res.json({
        success: false,
        message: "Invalid UOM options format",
      });
    }

    // Debug the request files
    console.log(
      "Files in request:",
      req.files ? Object.keys(req.files) : "No files"
    );

    // Handle image uploads
    const images = [];
    const imageFiles = [
      req.files?.image1?.[0],
      req.files?.image2?.[0],
      req.files?.image3?.[0],
      req.files?.image4?.[0],
    ].filter(Boolean);

    console.log(`Found ${imageFiles.length} image files to process`);

    if (imageFiles.length === 0) {
      console.log("No image files found in the request");
    } else {
      console.log(
        "Image files to process:",
        imageFiles.map((f) => ({
          fieldname: f.fieldname,
          originalname: f.originalname,
          path: f.path,
          size: f.size,
        }))
      );
    }

    // Upload all images to Cloudinary
    for (const file of imageFiles) {
      try {
        console.log(`Processing file: ${file.fieldname}, ${file.originalname}`);
        const imageUrl = await uploadToCloudinary(file);
        if (imageUrl) {
          console.log("Successfully uploaded to Cloudinary, URL:", imageUrl);
          images.push(imageUrl);
        } else {
          console.error(
            "Failed to upload image to Cloudinary:",
            file.originalname
          );
        }
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
      }
    }

    console.log(`Successfully uploaded ${images.length} images to Cloudinary`);

    // Create product data object with only the new schema fields
    const productData = {
      itemName,
      pcode,
      baseUnit,
      packagingSize,
      bestseller: bestseller === "true" || bestseller === true,
      uomOptions: parsedUomOptions,
      image: images,
      date: Date.now(),
    };

    // Log the data being saved
    console.log("Final product data being saved:", {
      ...productData,
      image:
        productData.image.length > 0
          ? `${productData.image.length} images`
          : "No images",
    });

    // Create and save the product
    const product = new productModel(productData);
    const savedProduct = await product.save();

    console.log("Saved product:", {
      id: savedProduct._id,
      pcode: savedProduct.pcode,
      imageCount: savedProduct.image ? savedProduct.image.length : 0,
    });

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
      baseUnit,
      packagingSize,
      bestseller,
      uomOptions,
      existingImages,
      imagesToRemove,
    } = req.body;

    // Parse JSON strings
    let parsedUomOptions;
    let parsedExistingImages = [];
    let parsedImagesToRemove = [];

    try {
      parsedUomOptions = JSON.parse(uomOptions);

      if (existingImages) {
        parsedExistingImages = JSON.parse(existingImages);
      }

      if (imagesToRemove) {
        parsedImagesToRemove = JSON.parse(imagesToRemove);
      }
    } catch (error) {
      console.error("Error parsing JSON data:", error);
      return res.json({
        success: false,
        message: "Invalid data format",
      });
    }

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

    // Start with existing images that should be kept
    let finalImages = [...parsedExistingImages];

    // Upload new images if provided
    if (image1) {
      const imageUrl = await uploadToCloudinary(image1);
      if (imageUrl) finalImages.push(imageUrl);
    }
    if (image2) {
      const imageUrl = await uploadToCloudinary(image2);
      if (imageUrl) finalImages.push(imageUrl);
    }
    if (image3) {
      const imageUrl = await uploadToCloudinary(image3);
      if (imageUrl) finalImages.push(imageUrl);
    }
    if (image4) {
      const imageUrl = await uploadToCloudinary(image4);
      if (imageUrl) finalImages.push(imageUrl);
    }

    // Limit to 4 images maximum
    finalImages = finalImages.slice(0, 4);

    // Update product with only the new schema fields
    const updatedProduct = await productModel.findByIdAndUpdate(
      id,
      {
        itemName,
        pcode,
        baseUnit,
        packagingSize,
        bestseller: bestseller === "true" || bestseller === true,
        uomOptions: parsedUomOptions,
        image: finalImages,
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
