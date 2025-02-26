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
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

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

// Add this function to save price lists to MongoDB
async function savePriceListsToMongoDB(priceLists) {
  try {
    console.log("Saving price lists to MongoDB...");

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
        unitPrice: item.unitPrice,
        baseUnit: item.baseUnit,
      });
    }

    // Convert to array
    const priceListArray = Object.values(customerPriceLists);

    console.log(
      `Prepared ${priceListArray.length} customer price lists for MongoDB`
    );

    // Update or insert price lists
    for (const priceList of priceListArray) {
      await PriceList.findOneAndUpdate(
        { customerId: priceList.customerId },
        {
          $set: {
            customerName: priceList.customerName,
            items: priceList.items,
            lastUpdated: new Date(),
          },
        },
        { upsert: true, new: true }
      );
    }

    console.log(
      `Successfully saved ${priceListArray.length} price lists to MongoDB`
    );
    return true;
  } catch (err) {
    console.error("Error saving price lists to MongoDB:", err);
    return false;
  }
}

// Main function
async function main() {
  let mongoConnection = null;
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

      // Save to MongoDB
      await savePriceListsToMongoDB(allPriceLists);
    } else {
      console.log("No price list entries found for any customers.");
    }

    console.log("\nExport completed successfully.");
  } catch (err) {
    console.error("Error in main execution:", err);
  } finally {
    // Close connections
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");

    if (sqlPool) {
      await sql.close();
      console.log("Disconnected from SQL Server");
    }
  }
}

// Run the main function
main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
