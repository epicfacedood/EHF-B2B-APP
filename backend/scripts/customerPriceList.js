// Import required modules
import sql from "mssql";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import PriceList from "../models/priceListModel.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Get credentials from environment variables
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_SERVER = process.env.DB_SERVER;
const DB_NAME = process.env.DB_NAME;
const MONGODB_URI = process.env.MONGODB_URI;

// After loading environment variables, add this debugging section
console.log("Environment variables loaded:");
console.log("DB_SERVER:", DB_SERVER);
console.log("DB_NAME:", DB_NAME);
console.log("DB_USER:", DB_USER ? "Set (value hidden)" : "Not set");
console.log("DB_PASSWORD:", DB_PASSWORD ? "Set (value hidden)" : "Not set");
console.log("MONGODB_URI:", MONGODB_URI ? "Set (value hidden)" : "Not set");

// Make sure the server value is valid
if (!DB_SERVER) {
  throw new Error("DB_SERVER environment variable is not set or is empty");
}

// SQL Server configuration
const sqlConfig = {
  user: DB_USER,
  password: DB_PASSWORD,
  server: DB_SERVER, // This must be a non-empty string
  database: DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

// Add this to verify the config
console.log("SQL Server configuration:");
console.log("server:", sqlConfig.server);
console.log("database:", sqlConfig.database);
console.log("user:", sqlConfig.user ? "Set (value hidden)" : "Not set");
console.log("password:", sqlConfig.password ? "Set (value hidden)" : "Not set");

// Create output directory
const outputDir = path.join(__dirname, "nav_data_exports");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate timestamp for filenames
const timestamp = new Date().toISOString().replace(/[:.]/g, "_");

// Function to save data to JSON
async function saveToJson(data, filename, description) {
  try {
    if (data.length > 0) {
      // Create full path with timestamp
      const outputFile = path.join(outputDir, `${filename}_${timestamp}.json`);

      // Save to JSON
      fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));

      console.log(`Data saved to ${outputFile}`);

      // Print sample data
      console.log(`\nSample ${description} (first 5 rows):`);
      console.log("=".repeat(80));
      console.log(JSON.stringify(data.slice(0, 5), null, 2));
      console.log("=".repeat(80));

      return true;
    } else {
      console.log(`No ${description} data found.`);
      return false;
    }
  } catch (err) {
    console.error(`Error saving ${description}:`, err);
    return false;
  }
}

// Function to get customer IDs from MongoDB
async function getCustomerIdsFromMongoDB() {
  try {
    console.log("Using existing MongoDB connection...");

    // Import the User model dynamically
    const { default: User } = await import("../models/userModel.js");

    // Find all users with a customerId
    const users = await User.find({
      customerId: { $exists: true, $ne: "" },
    }).select("customerId name company");

    console.log(`Found ${users.length} users with customer IDs in MongoDB`);

    return users;
  } catch (err) {
    console.error("Error retrieving customer IDs from MongoDB:", err);
    return [];
  }
}

// Function to get price list for a specific customer
async function getCustomerPriceList(pool, customerId) {
  try {
    const query = `
    SELECT 
        a.[Sales Code] AS customerId, 
        a.[Item No_] AS pcode, 
        a.[Unit Price] AS unitPrice, 
        a.[Unit of Measure Code] AS baseUnit, 
        c.Name AS customerName, 
        i.Description AS itemName 
    FROM (
        SELECT 
            sp.[Sales Code], 
            sp.[Item No_], 
            sp.[Unit Price], 
            sp.[Unit of Measure Code] 
        FROM dbo.[LIVE EASTERN HARVEST$Sales Price] sp
        WHERE sp.[Sales Type] = 0 AND sp.[Sales Code] = '${customerId}'
    ) a 
    INNER JOIN dbo.[LIVE EASTERN HARVEST$Customer] c ON c.No_ = a.[Sales Code]
    INNER JOIN dbo.[LIVE EASTERN HARVEST$Item] i ON i.No_ = a.[Item No_]
    `;

    const result = await pool.request().query(query);
    return result.recordset;
  } catch (err) {
    console.error(`Error getting price list for customer ${customerId}:`, err);
    return [];
  }
}

// Modify savePriceListsToMongoDB function to be additive
async function savePriceListsToMongoDB(priceLists) {
  try {
    console.log("Processing price lists to MongoDB...");

    // Group price lists by customerId
    const customerPriceLists = {};

    for (const item of priceLists) {
      if (!customerPriceLists[item.customerId]) {
        customerPriceLists[item.customerId] = {
          customerId: item.customerId,
          customerName: item.customerName,
          items: [],
        };
      }

      customerPriceLists[item.customerId].items.push({
        pcode: item.pcode,
        itemName: item.itemName,
        price: item.unitPrice,
        notes: "",
      });
    }

    // Convert to array
    const priceListArray = Object.values(customerPriceLists);
    console.log(`Processing ${priceListArray.length} customer price lists`);

    const syncStats = {
      customersProcessed: 0,
      newCustomers: 0,
      existingCustomers: 0,
      totalItemsAdded: 0,
      totalItemsUpdated: 0,
      totalItemsUnchanged: 0,
    };

    // Update or insert price lists
    for (const priceList of priceListArray) {
      syncStats.customersProcessed++;

      // First, check if customer already has a price list
      const existingPriceList = await PriceList.findOne({
        customerId: priceList.customerId,
      });

      if (!existingPriceList) {
        // Case 1: New customer - just create a new price list
        await PriceList.create({
          customerId: priceList.customerId,
          customerName: priceList.customerName,
          items: priceList.items,
          lastUpdated: new Date(),
        });

        syncStats.newCustomers++;
        syncStats.totalItemsAdded += priceList.items.length;

        console.log(
          `Created new price list for ${priceList.customerId} with ${priceList.items.length} items`
        );
      } else {
        // Case 2: Existing customer - add only new items or update changed prices
        syncStats.existingCustomers++;

        // Keep track of items we process
        const itemsAdded = [];
        const itemsUpdated = [];
        const itemsUnchanged = [];

        // Create a map of existing items for easy lookup
        const existingItemsMap = {};
        existingPriceList.items.forEach((item) => {
          existingItemsMap[item.pcode] = {
            price: item.price,
            itemName: item.itemName,
            notes: item.notes || "",
          };
        });

        // Process each item in the new price list
        for (const newItem of priceList.items) {
          const existingItem = existingItemsMap[newItem.pcode];

          if (!existingItem) {
            // This is a new item - add it
            existingPriceList.items.push(newItem);
            itemsAdded.push(newItem.pcode);
          } else if (Number(existingItem.price) !== Number(newItem.price)) {
            // Price has changed - update it
            const itemIndex = existingPriceList.items.findIndex(
              (item) => item.pcode === newItem.pcode
            );

            if (itemIndex !== -1) {
              // Preserve existing notes
              const existingNotes =
                existingPriceList.items[itemIndex].notes || "";

              // Update the item with new price but keep existing notes
              existingPriceList.items[itemIndex] = {
                ...newItem,
                notes: existingNotes,
              };

              itemsUpdated.push(newItem.pcode);
            }
          } else {
            // Item exists with same price - no change needed
            itemsUnchanged.push(newItem.pcode);
          }
        }

        // Update stats
        syncStats.totalItemsAdded += itemsAdded.length;
        syncStats.totalItemsUpdated += itemsUpdated.length;
        syncStats.totalItemsUnchanged += itemsUnchanged.length;

        // Only save if we made changes
        if (itemsAdded.length > 0 || itemsUpdated.length > 0) {
          existingPriceList.lastUpdated = new Date();
          existingPriceList.customerName = priceList.customerName; // Update customer name
          await existingPriceList.save();

          console.log(
            `Updated price list for ${priceList.customerId}: ` +
              `${itemsAdded.length} items added, ` +
              `${itemsUpdated.length} prices updated, ` +
              `${itemsUnchanged.length} unchanged`
          );
        } else {
          console.log(
            `No changes for ${priceList.customerId} (${itemsUnchanged.length} items unchanged)`
          );
        }
      }
    }

    console.log("\n===== Price List Sync Summary =====");
    console.log(`Customers Processed: ${syncStats.customersProcessed}`);
    console.log(`New Customers: ${syncStats.newCustomers}`);
    console.log(`Existing Customers: ${syncStats.existingCustomers}`);
    console.log(`Total Items Added: ${syncStats.totalItemsAdded}`);
    console.log(`Total Prices Updated: ${syncStats.totalItemsUpdated}`);
    console.log(`Total Items Unchanged: ${syncStats.totalItemsUnchanged}`);
    console.log("==================================\n");

    return syncStats;
  } catch (err) {
    console.error("Error saving price lists to MongoDB:", err);
    return false;
  }
}

// Export the main function so it can be imported
export async function main() {
  let sqlPool = null;

  try {
    console.log("Starting customer price list export...");

    // Step 1: Get customer IDs from MongoDB
    const users = await getCustomerIdsFromMongoDB();

    if (users.length === 0) {
      console.log("No customer IDs found in MongoDB. Exiting.");
      return;
    }

    // Step 2: Connect to SQL Server
    console.log("Connecting to SQL Server...");
    sqlPool = await sql.connect(sqlConfig);
    console.log("Connected to SQL Server");

    // Step 3: Get price lists for each customer
    console.log("Retrieving price lists for customers...");
    let allPriceLists = [];

    for (const user of users) {
      const customerId = user.customerId;
      console.log(
        `Getting price list for customer: ${user.name} (${customerId})`
      );

      const priceList = await getCustomerPriceList(sqlPool, customerId);

      if (priceList.length > 0) {
        console.log(`Found ${priceList.length} price entries for ${user.name}`);
        allPriceLists = [...allPriceLists, ...priceList];
      } else {
        console.log(`No price list found for ${user.name} (${customerId})`);
      }
    }

    // Step 4: Save all price lists to a JSON file
    if (allPriceLists.length > 0) {
      await saveToJson(
        allPriceLists,
        "customer_price_lists",
        "Customer Price Lists"
      );
      console.log(`Total price list entries: ${allPriceLists.length}`);

      // Save to MongoDB with the improved function
      const syncStats = await savePriceListsToMongoDB(allPriceLists);

      // Return the sync stats so the API can use it
      return syncStats;
    } else {
      console.log("No price list entries found for any customers.");
      return {
        customersProcessed: 0,
        newCustomers: 0,
        existingCustomers: 0,
        totalItemsAdded: 0,
        totalItemsUpdated: 0,
        totalItemsUnchanged: 0,
        message: "No price list entries found",
      };
    }

    console.log("\nExport completed successfully.");
  } catch (err) {
    console.error("Error in main execution:", err);
    throw err; // Re-throw to allow caller to handle
  } finally {
    // Only close SQL connection, not MongoDB
    if (sqlPool) {
      await sql.close();
      console.log("Disconnected from SQL Server");
    }
  }
}

// Only run the main function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("Unhandled error:", err);
    process.exit(1);
  });
}
