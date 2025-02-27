import express from "express";
import { isAuth } from "../middleware/authMiddleware.js";
import apiKeyAuth from "../middleware/apiKeyAuth.js";
import PriceList from "../models/priceListModel.js";

const router = express.Router();

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

// Add a new item to a customer's price list using API key
router.post(
  "/apikey/customer/:customerId/item",
  apiKeyAuth,
  async (req, res) => {
    try {
      const { customerId } = req.params;
      const newItem = req.body;

      console.log("Adding item to price list for customer:", customerId);
      console.log("Item data:", newItem);

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: "Customer ID is required",
        });
      }

      if (!newItem || !newItem.pcode) {
        return res.status(400).json({
          success: false,
          message: "Product code is required",
        });
      }

      // Validate required fields
      if (!newItem.itemName || newItem.itemName.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Item name is required",
        });
      }

      if (
        newItem.price === undefined ||
        newItem.price === null ||
        isNaN(parseFloat(newItem.price))
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid price is required",
        });
      }

      // Ensure price is a number
      newItem.price = parseFloat(newItem.price);

      // Find the price list for this customer
      let priceList = await PriceList.findOne({ customerId });
      console.log("Found price list:", priceList ? "Yes" : "No");

      // If no price list exists, create one
      if (!priceList) {
        console.log("Creating new price list for customer:", customerId);
        priceList = new PriceList({
          customerId,
          items: [],
        });
      }

      // Check if item already exists
      const existingItemIndex = priceList.items.findIndex(
        (item) => item.pcode === newItem.pcode
      );

      console.log("Item exists in price list:", existingItemIndex >= 0);

      if (existingItemIndex >= 0) {
        return res.json({
          success: false,
          message: "Item already exists in price list",
        });
      }

      // Add the new item to the existing items array
      priceList.items.push(newItem);
      console.log(
        `Added item to price list, now has ${priceList.items.length} items. Saving...`
      );

      // Save the updated price list
      await priceList.save();
      console.log("Price list saved successfully");

      return res.json({
        success: true,
        message: "Item added to price list",
        priceList,
      });
    } catch (error) {
      console.error("Error adding item to price list:", error);
      return res.status(500).json({
        success: false,
        message: "Server error while adding item to price list",
        error: error.message,
      });
    }
  }
);

// Add a route to fix existing price lists
router.get("/admin/fix-price-lists", apiKeyAuth, async (req, res) => {
  try {
    console.log("Starting price list repair...");

    // Get all price lists
    const priceLists = await PriceList.find({});
    console.log(`Found ${priceLists.length} price lists to check`);

    let fixedCount = 0;

    for (const priceList of priceLists) {
      let needsUpdate = false;

      // Filter out invalid items
      const validItems = priceList.items.filter((item) => {
        return (
          item.pcode &&
          item.itemName &&
          item.price !== undefined &&
          item.price !== null &&
          !isNaN(parseFloat(item.price))
        );
      });

      // Check if any items were removed
      if (validItems.length !== priceList.items.length) {
        console.log(
          `Fixing price list for customer ${priceList.customerId}: Removed ${
            priceList.items.length - validItems.length
          } invalid items`
        );
        priceList.items = validItems;
        needsUpdate = true;
      }

      // Ensure all items have the required fields
      for (const item of priceList.items) {
        if (!item.notes) {
          item.notes = "";
          needsUpdate = true;
        }

        // Ensure price is a number
        if (typeof item.price !== "number") {
          item.price = parseFloat(item.price) || 0;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await priceList.save();
        fixedCount++;
      }
    }

    return res.json({
      success: true,
      message: `Price list repair complete. Fixed ${fixedCount} price lists.`,
    });
  } catch (error) {
    console.error("Error fixing price lists:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fixing price lists",
      error: error.message,
    });
  }
});

// Add a simple fix route
router.get("/fix", apiKeyAuth, async (req, res) => {
  try {
    // Get all price lists
    const priceLists = await PriceList.find();
    let fixedCount = 0;

    for (const priceList of priceLists) {
      // Remove any items with missing required fields
      const validItems = priceList.items.filter(
        (item) => item.pcode && item.itemName && !isNaN(parseFloat(item.price))
      );

      // If we removed any items, save the changes
      if (validItems.length !== priceList.items.length) {
        priceList.items = validItems;
        await priceList.save();
        fixedCount++;
      }
    }

    return res.json({
      success: true,
      message: `Fixed ${fixedCount} price lists`,
    });
  } catch (error) {
    console.error("Error fixing price lists:", error);
    return res.status(500).json({
      success: false,
      message: "Error fixing price lists",
    });
  }
});

// Add a route to trigger price list sync
router.post("/sync", apiKeyAuth, async (req, res) => {
  try {
    console.log("Starting price list sync...");

    // Import the script dynamically
    const { main } = await import("../scripts/customerPriceList.js");

    // Run the sync in the background
    res.json({
      success: true,
      message: "Price list sync started. This may take a few minutes.",
    });

    // Execute the sync after sending the response
    main()
      .then(() => {
        console.log("Price list sync completed successfully");
      })
      .catch((error) => {
        console.error("Price list sync failed:", error);
      });
  } catch (error) {
    console.error("Error starting price list sync:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to start price list sync",
      error: error.message,
    });
  }
});

// Add a route to remove an item from a customer's price list
router.delete(
  "/apikey/customer/:customerId/item/:pcode",
  apiKeyAuth,
  async (req, res) => {
    try {
      const { customerId, pcode } = req.params;

      console.log(
        `Removing item ${pcode} from price list for customer ${customerId}`
      );

      if (!customerId || !pcode) {
        return res.status(400).json({
          success: false,
          message: "Customer ID and product code are required",
        });
      }

      // Find the price list for this customer
      const priceList = await PriceList.findOne({ customerId });

      if (!priceList) {
        return res.status(404).json({
          success: false,
          message: "Price list not found for this customer",
        });
      }

      // Check if the item exists in the price list
      const initialItemCount = priceList.items.length;

      // Remove the item from the items array
      priceList.items = priceList.items.filter((item) => item.pcode !== pcode);

      // If no items were removed, the item wasn't in the list
      if (priceList.items.length === initialItemCount) {
        return res.status(404).json({
          success: false,
          message: "Item not found in price list",
        });
      }

      // Save the updated price list
      await priceList.save();

      return res.json({
        success: true,
        message: "Item removed from price list",
        priceList,
      });
    } catch (error) {
      console.error("Error removing item from price list:", error);
      return res.status(500).json({
        success: false,
        message: "Server error while removing item from price list",
        error: error.message,
      });
    }
  }
);

// Add this route to your price list routes
router.get("/customer", isAuth, async (req, res) => {
  try {
    const { customerId } = req.query;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    // Find the price list for this customer
    const priceList = await PriceList.findOne({ customerId });

    if (!priceList) {
      return res.status(404).json({
        success: false,
        message: "No price list found for this customer",
      });
    }

    res.json({
      success: true,
      priceList,
    });
  } catch (error) {
    console.error("Error fetching customer price list:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;
