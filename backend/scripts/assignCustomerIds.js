import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Import models
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    customerId: String,
    isAdmin: Boolean,
  })
);

const PriceList = mongoose.model(
  "PriceList",
  new mongoose.Schema({
    customerId: String,
    itemNo: String,
    price: Number,
  })
);

async function assignCustomerIds() {
  try {
    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    // Get all unique customer IDs from price list
    const priceListItems = await PriceList.find({});
    const customerIds = [
      ...new Set(priceListItems.map((item) => item.customerId)),
    ];
    console.log(
      `Found ${customerIds.length} unique customer IDs in price list`
    );

    // Assign customer IDs to users who don't have one
    let updated = 0;

    for (const user of users) {
      if (!user.customerId && customerIds.length > 0) {
        // Assign a customer ID from the list
        const customerId = customerIds[0]; // Use the first one for simplicity

        console.log(
          `Assigning customer ID ${customerId} to user ${user.email}`
        );

        user.customerId = customerId;
        await user.save();

        updated++;
      }
    }

    console.log(`Updated ${updated} users with customer IDs`);

    // List users with their customer IDs
    const updatedUsers = await User.find({});
    updatedUsers.forEach((user) => {
      console.log(
        `User: ${user.email}, Customer ID: ${user.customerId || "None"}`
      );
    });
  } catch (error) {
    console.error("Error assigning customer IDs:", error);
  } finally {
    mongoose.disconnect();
  }
}

assignCustomerIds();
