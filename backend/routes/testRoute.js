import express from "express";
import PriceList from "../models/priceListModel.js";
import Product from "../models/productModel.js";
import jwt from "jsonwebtoken";

const testRouter = express.Router();

// Simple health check route
testRouter.get("/ping", (req, res) => {
  res.json({
    success: true,
    message: "API is working",
    timestamp: new Date().toISOString(),
  });
});

// This route is useful for debugging customer price lists
testRouter.get("/price-list/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    // Find all price list items for this customer
    const priceListItems = await PriceList.find({ customerId });

    // Extract the item numbers
    const productCodes = priceListItems.map((item) => item.itemNo);

    res.json({
      success: true,
      customerId,
      count: productCodes.length,
      sampleItems: priceListItems.slice(0, 5),
      sampleCodes: productCodes.slice(0, 5),
    });
  } catch (error) {
    console.error(
      `Error fetching price list for customer ${req.params.customerId}:`,
      error
    );
    res.status(500).json({
      success: false,
      message: "Error fetching price list",
      error: error.message,
    });
  }
});

// Add a token debug route
testRouter.get("/check-token", (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.json({
        success: false,
        message: "No authorization header",
      });
    }

    // Check if it's a Bearer token
    if (!authHeader.startsWith("Bearer ")) {
      return res.json({
        success: false,
        message: "Not a Bearer token",
        header: authHeader,
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.json({
        success: false,
        message: "No token found after Bearer",
      });
    }

    // Try to decode the token without verification
    const decoded = jwt.decode(token);

    return res.json({
      success: true,
      token: token.substring(0, 20) + "...",
      tokenLength: token.length,
      decoded,
    });
  } catch (error) {
    return res.json({
      success: false,
      message: "Error checking token",
      error: error.message,
    });
  }
});

export default testRouter;
