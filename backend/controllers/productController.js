//function for add product

import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";

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

    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];

    const images = [image1, image2, image3, image4].filter(
      (item) => item !== undefined
    );

    let imagesURL = await Promise.all(
      images.map(async (item) => {
        let result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      })
    );

    const productData = {
      itemName,
      pcode,
      price: Number(price),
      baseUnit,
      packagingSize,
      uom,
      uoms,
      category,
      bestseller: bestseller === "true" ? true : false,
      image: imagesURL,
      date: Date.now(),
    };

    console.log("Product Data:", productData);
    const product = new productModel(productData);
    await product.save();

    res.json({ success: true, message: "product added" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const listProducts = async (req, res) => {
  try {
    const { userId } = req;
    let products;

    if (userId) {
      // If user is logged in, get their available products
      const user = await userModel.findById(userId);
      console.log(
        "User found:",
        user?._id,
        "Available products:",
        user?.productsAvailable
      );

      if (user && user.productsAvailable?.length > 0) {
        products = await productModel
          .find({ _id: { $in: user.productsAvailable } })
          .sort({ createdAt: -1 });
      } else {
        products = [];
      }
    } else {
      // If no user, return empty array (or you could return an error)
      products = [];
    }

    console.log("Returning products:", products.length);
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
    res.json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await productModel.find({}).sort({ itemName: 1 });
    res.json({ success: true, products });
  } catch (error) {
    console.error("Error getting products:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching products" });
  }
};

export { addProduct, listProducts, removeProduct, singleProduct };
