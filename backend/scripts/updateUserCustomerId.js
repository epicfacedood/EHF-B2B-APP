import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

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

// Function to update a user's customer ID
async function updateUserCustomerId(email, customerId) {
  try {
    // Find the user by email
    const User = mongoose.model("User");
    const user = await User.findOne({ email });

    if (!user) {
      console.error(`User with email ${email} not found`);
      return false;
    }

    // Check if the customer ID exists in the price list
    const PriceList = mongoose.model("PriceList");
    const priceListItems = await PriceList.find({ customerId });

    if (priceListItems.length === 0) {
      console.error(`No price list items found for customer ID: ${customerId}`);
      return false;
    }

    // Update the user's customer ID
    user.customerId = customerId;
    await user.save();

    console.log(`Updated user ${email} with customer ID ${customerId}`);
    console.log(
      `This customer ID has ${priceListItems.length} price list items`
    );

    return true;
  } catch (error) {
    console.error("Error updating user customer ID:", error);
    return false;
  } finally {
    mongoose.disconnect();
  }
}

// Get command line arguments
const email = process.argv[2];
const customerId = process.argv[3];

if (!email || !customerId) {
  console.error("Usage: node updateUserCustomerId.js <email> <customerId>");
  process.exit(1);
}

// Run the update function
updateUserCustomerId(email, customerId);
