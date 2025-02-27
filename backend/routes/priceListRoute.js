import express from "express";
import { isAuth } from "../middleware/authMiddleware.js";
import apiKeyAuth from "../middleware/apiKeyAuth.js";
import PriceList from "../models/priceListModel.js";

const router = express.Router();

// Public test route - no auth required
router.get("/test", async (req, res) => {
  return res.json({
    success: true,
    message: "Price list route is working!",
  });
});

// Debug route - restore isAuth middleware
router.get("/debug/scan/:customerId", isAuth, async (req, res) => {
  try {
    const { customerId } = req.params;

    console.log(
      `🔍 DEBUG: Scanning all price lists for customerId: ${customerId}`
    );

    // Get all price lists
    const allPriceLists = await PriceList.find({}).lean();
    console.log(`Found ${allPriceLists.length} total price lists in database`);

    // Log all customer IDs for comparison
    const allCustomerIds = allPriceLists.map((pl) => pl.customerId);
    console.log(
      `All customer IDs in database: ${JSON.stringify(allCustomerIds)}`
    );

    // Check for exact matches
    const exactMatch = allPriceLists.find((pl) => pl.customerId === customerId);
    if (exactMatch) {
      console.log(`✅ EXACT MATCH found for ${customerId}:`);
      console.log(JSON.stringify(exactMatch, null, 2));
    } else {
      console.log(`❌ No exact match found for ${customerId}`);

      // Check for case-insensitive matches
      const caseInsensitiveMatch = allPriceLists.find(
        (pl) => pl.customerId.toLowerCase() === customerId.toLowerCase()
      );

      if (caseInsensitiveMatch) {
        console.log(`🔤 CASE-INSENSITIVE match found:`);
        console.log(
          `Searched for: "${customerId}", Found: "${caseInsensitiveMatch.customerId}"`
        );
      }

      // Check for partial matches
      const partialMatches = allPriceLists.filter(
        (pl) =>
          pl.customerId.includes(customerId) ||
          customerId.includes(pl.customerId)
      );

      if (partialMatches.length > 0) {
        console.log(`📎 PARTIAL matches found (${partialMatches.length}):`);
        partialMatches.forEach((match) => {
          console.log(`- "${match.customerId}"`);
        });
      }
    }

    return res.json({
      success: true,
      message: "Scan complete, check server logs",
      customerIdSearched: customerId,
      totalPriceLists: allPriceLists.length,
      allCustomerIds,
    });
  } catch (error) {
    console.error("Error scanning price lists:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while scanning price lists",
    });
  }
});

// Get price list by customer ID - restore isAuth middleware
router.get("/customer/:customerId", isAuth, async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    console.log(`Searching for price list with customerId: ${customerId}`);

    // Add debug logging to see what's in the database
    const allPriceLists = await PriceList.find({}).lean();
    console.log(`Found ${allPriceLists.length} total price lists in database`);
    console.log(
      `Available customer IDs: ${allPriceLists
        .map((pl) => pl.customerId)
        .join(", ")}`
    );

    // Try exact match first
    let priceList = await PriceList.findOne({ customerId }).lean();

    // If no exact match, try case-insensitive match
    if (!priceList) {
      console.log(`No exact match found, trying case-insensitive match...`);

      // Find all price lists and filter manually for case-insensitive match
      const caseInsensitiveMatch = allPriceLists.find(
        (pl) => pl.customerId.toLowerCase() === customerId.toLowerCase()
      );

      if (caseInsensitiveMatch) {
        console.log(
          `Found case-insensitive match: ${caseInsensitiveMatch.customerId}`
        );
        priceList = caseInsensitiveMatch;
      }
    }

    if (!priceList) {
      console.log(`No price list found for customerId: ${customerId}`);
      return res.json({
        success: false,
        message: "No price list found for this customer ID",
      });
    }

    console.log(
      `Found price list for ${customerId} with ${
        priceList.items?.length || 0
      } items`
    );

    return res.json({
      success: true,
      priceList,
    });
  } catch (error) {
    console.error("Error fetching price list:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching price list",
    });
  }
});

// Special testing route - NO AUTH for troubleshooting
router.get("/noauth/customer/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    console.log(`NOAUTH route: Looking for customer ID ${customerId}`);

    // Get all price lists
    const allPriceLists = await PriceList.find({}).lean();
    console.log(`Found ${allPriceLists.length} total price lists in database`);

    // Try exact match first
    let priceList = await PriceList.findOne({ customerId }).lean();

    // If no exact match, try case-insensitive match
    if (!priceList) {
      const caseInsensitiveMatch = allPriceLists.find(
        (pl) => pl.customerId.toLowerCase() === customerId.toLowerCase()
      );

      if (caseInsensitiveMatch) {
        priceList = caseInsensitiveMatch;
      }
    }

    if (!priceList) {
      return res.json({
        success: false,
        message: "No price list found for this customer ID",
      });
    }

    return res.json({
      success: true,
      priceList,
    });
  } catch (error) {
    console.error("Error in NOAUTH route:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// API Key authenticated route for price lists
router.get("/apikey/customer/:customerId", apiKeyAuth, async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    console.log(
      `API Key Auth: Looking for price list with customerId: ${customerId}`
    );

    // Get all price lists
    const allPriceLists = await PriceList.find({}).lean();
    console.log(`Found ${allPriceLists.length} total price lists in database`);

    // Try exact match first
    let priceList = await PriceList.findOne({ customerId }).lean();

    // If no exact match, try case-insensitive match
    if (!priceList) {
      const caseInsensitiveMatch = allPriceLists.find(
        (pl) => pl.customerId.toLowerCase() === customerId.toLowerCase()
      );

      if (caseInsensitiveMatch) {
        priceList = caseInsensitiveMatch;
      }
    }

    if (!priceList) {
      return res.json({
        success: false,
        message: "No price list found for this customer ID",
      });
    }

    return res.json({
      success: true,
      priceList,
    });
  } catch (error) {
    console.error("Error in API Key auth route:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;
