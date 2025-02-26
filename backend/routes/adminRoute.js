import express from "express";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import adminAuth from "../middleware/adminAuth.js";
import fs from "fs";

const adminRouter = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple test endpoint to verify the router is working
adminRouter.get("/test", (req, res) => {
  console.log("Admin router test endpoint hit");
  res.json({ success: true, message: "Admin router is working" });
});

// Endpoint to run the script that updates customer price list
adminRouter.post("/update-price-list", async (req, res) => {
  try {
    console.log("Starting customer price list update process...");

    // Path to the script
    const scriptPath = path.join(__dirname, "../scripts/customerPriceList.js");

    // Execute the script
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${error.message}`);
        return res.status(500).json({
          success: false,
          message: "Failed to update price list",
          error: error.message,
        });
      }

      if (stderr) {
        console.error(`Script stderr: ${stderr}`);
      }

      console.log(`Script output: ${stdout}`);

      return res.json({
        success: true,
        message: "Price list updated successfully",
        details: stdout,
      });
    });
  } catch (error) {
    console.error("Error updating price list:", error);
    res.status(500).json({
      success: false,
      message: "Error updating price list",
      error: error.message,
    });
  }
});

// Endpoint to run the script that updates customer product list
adminRouter.post("/update-product-list", async (req, res) => {
  try {
    console.log("Starting product list update process...");

    // Path to the script
    const scriptPath = path.join(__dirname, "../scripts/retrieveItemCodes.js");

    // Execute the script
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${error.message}`);
        return res.status(500).json({
          success: false,
          message: "Failed to update product list",
          error: error.message,
        });
      }

      if (stderr) {
        console.error(`Script stderr: ${stderr}`);
      }

      console.log(`Script output: ${stdout}`);

      return res.json({
        success: true,
        message: "Product list updated successfully",
        details: stdout,
      });
    });
  } catch (error) {
    console.error("Error updating product list:", error);
    res.status(500).json({
      success: false,
      message: "Error updating product list",
      error: error.message,
    });
  }
});

// Endpoint to clean up invalid product data
adminRouter.post("/cleanup-products", async (req, res) => {
  try {
    console.log("Starting product data cleanup process...");

    // Path to the script
    const scriptPath = path.join(__dirname, "../scripts/cleanupProducts.js");

    // Execute the script
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${error.message}`);
        return res.status(500).json({
          success: false,
          message: "Failed to clean up product data",
          error: error.message,
        });
      }

      if (stderr) {
        console.error(`Script stderr: ${stderr}`);
      }

      console.log(`Script output: ${stdout}`);

      return res.json({
        success: true,
        message: "Product data cleaned up successfully",
        details: stdout,
      });
    });
  } catch (error) {
    console.error("Error cleaning up product data:", error);
    res.status(500).json({
      success: false,
      message: "Error cleaning up product data",
      error: error.message,
    });
  }
});

// Endpoint to identify invalid product data without modifying it
adminRouter.post("/identify-invalid-products", async (req, res) => {
  try {
    console.log("Starting product data analysis process...");

    // Path to the script
    const scriptPath = path.join(
      __dirname,
      "../scripts/identifyInvalidProducts.js"
    );

    // Execute the script
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${error.message}`);
        return res.status(500).json({
          success: false,
          message: "Failed to analyze product data",
          error: error.message,
        });
      }

      if (stderr) {
        console.error(`Script stderr: ${stderr}`);
      }

      console.log(`Script output: ${stdout}`);

      // Extract the path to the JSON file from the output
      const jsonFileMatch = stdout.match(
        /Detailed list of products with issues saved to: (.+\.json)/
      );
      const jsonFilePath = jsonFileMatch ? jsonFileMatch[1] : null;

      let invalidProducts = [];
      if (jsonFilePath && fs.existsSync(jsonFilePath)) {
        try {
          invalidProducts = JSON.parse(fs.readFileSync(jsonFilePath, "utf8"));
        } catch (err) {
          console.error("Error reading JSON file:", err);
        }
      }

      return res.json({
        success: true,
        message: "Product data analysis completed successfully",
        details: stdout,
        invalidProducts: invalidProducts,
      });
    });
  } catch (error) {
    console.error("Error analyzing product data:", error);
    res.status(500).json({
      success: false,
      message: "Error analyzing product data",
      error: error.message,
    });
  }
});

export default adminRouter;
