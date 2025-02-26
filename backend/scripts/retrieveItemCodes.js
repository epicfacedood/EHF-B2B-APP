import sql from "mssql";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try different paths for .env file
console.log("Current directory:", process.cwd());
const possibleEnvPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../../.env"),
];

let envLoaded = false;
for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`Found .env file at: ${envPath}`);
    dotenv.config({ path: envPath });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.log(
    "No .env file found. Will try to use environment variables directly."
  );
  dotenv.config(); // Try default location as a last resort
}

// Get credentials from environment variables
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_SERVER = process.env.DB_SERVER;
const DB_NAME = process.env.DB_NAME;

// Debug environment variables
console.log("Environment variables loaded:");
console.log("DB_SERVER:", DB_SERVER);
console.log("DB_NAME:", DB_NAME);
console.log("DB_USER:", DB_USER ? "Set (value hidden)" : "Not set");
console.log("DB_PASSWORD:", DB_PASSWORD ? "Set (value hidden)" : "Not set");

// Allow manual entry of credentials if not found in environment
if (!DB_SERVER || !DB_NAME || !DB_USER || !DB_PASSWORD) {
  console.log(
    "\nEnvironment variables not set properly. Using hardcoded values for testing."
  );

  // IMPORTANT: Replace these with your actual values for testing
  // DO NOT commit these values to version control
  const testConfig = {
    user: "your_username", // Replace with your actual username
    password: "your_password", // Replace with your actual password
    server: "your_server", // Replace with your actual server
    database: "your_database", // Replace with your actual database
  };

  console.log("Using test configuration (with sensitive values hidden)");

  // Use the test configuration
  var sqlConfig = {
    user: testConfig.user,
    password: testConfig.password,
    server: testConfig.server,
    database: testConfig.database,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  };
} else {
  // Use the environment variables
  var sqlConfig = {
    user: DB_USER,
    password: DB_PASSWORD,
    server: DB_SERVER,
    database: DB_NAME,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  };
}

// Create output directory
const outputDir = path.join(__dirname, "nav_data_exports");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate timestamp for filenames
const timestamp = new Date().toISOString().replace(/[:.]/g, "_");

// Item code query - no limit to ensure we get all UOMs for each product
const itemCodeQuery = `
SELECT 
    i.No_ AS pcode,
    i.Description AS itemName,
    i.[Base Unit of Measure] AS baseUnit,
    i.[Packaging_Size] AS packagingSize,
    iuom.[Code] AS uoms,
    iuom.[Qty_ per Unit of Measure] AS quantityPerUnitOfMeasure
FROM dbo.[LIVE EASTERN HARVEST$Item] i
INNER JOIN dbo.[LIVE EASTERN HARVEST$Item Unit of Measure] iuom ON iuom.[Item No_] = i.No_
WHERE i.Blocked = 0
`;

// Function to combine items with the same product code
function combineItems(items) {
  const combinedItems = {};

  for (const item of items) {
    const pcode = item.pcode;

    if (!combinedItems[pcode]) {
      // Create a new entry for this product code
      combinedItems[pcode] = {
        pcode: pcode,
        itemName: item.itemName,
        baseUnit: item.baseUnit,
        packagingSize: item.packagingSize,
        uomOptions: [],
      };
    }

    // Add this UOM to the product's UOM options
    combinedItems[pcode].uomOptions.push({
      code: item.uoms,
      qtyPerUOM: item.quantityPerUnitOfMeasure,
    });
  }

  // Convert the object to an array
  return Object.values(combinedItems);
}

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
      console.log(`\nSample ${description} (first 20 rows):`);
      console.log("=".repeat(80));
      console.log(JSON.stringify(data.slice(0, 20), null, 2));
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

// Main function
async function main() {
  let sqlPool = null;

  try {
    console.log("Starting item code retrieval...");

    // Connect to SQL Server
    console.log("Connecting to SQL Server...");
    sqlPool = await sql.connect(sqlConfig);
    console.log("Connected to SQL Server");

    // Execute the query
    console.log("Executing item code query...");
    const result = await sqlPool.request().query(itemCodeQuery);

    console.log(
      `Query returned ${result.recordset.length} rows (before combining)`
    );

    // Combine items with the same product code
    const combinedItems = combineItems(result.recordset);
    console.log(`Combined into ${combinedItems.length} unique products`);

    // Save the results to a JSON file
    if (combinedItems.length > 0) {
      await saveToJson(
        combinedItems,
        "combined_item_codes",
        "Combined Item Codes"
      );

      // Print the first 20 items to the console
      console.log("\nFirst 20 combined items:");
      console.log("=".repeat(80));
      for (let i = 0; i < Math.min(20, combinedItems.length); i++) {
        const item = combinedItems[i];
        const uomCodes = item.uomOptions.map((uom) => uom.code).join(", ");
        console.log(`${item.pcode} - ${item.itemName} - UOMs: [${uomCodes}]`);
      }
      console.log("=".repeat(80));
    } else {
      console.log("No item codes found.");
    }

    console.log("\nRetrieval completed successfully.");
  } catch (err) {
    console.error("Error in main execution:", err);
  } finally {
    // Close SQL Server connection
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
