import mongoose from "mongoose";
import dotenv from "dotenv";
import userModel from "../models/userModel.js";

dotenv.config();

const migrateUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to database");

    const users = await userModel.find({});
    console.log(`Found ${users.length} users to migrate`);

    for (const user of users) {
      // Convert old cartData to new format if needed
      const newCartData = new Map();
      if (user.cartData && typeof user.cartData === "object") {
        Object.entries(user.cartData).forEach(([productId, quantities]) => {
          newCartData.set(productId, new Map(Object.entries(quantities)));
        });
      }

      // Update user with new fields
      await userModel.findByIdAndUpdate(user._id, {
        $set: {
          cartData: newCartData,
          productsAvailable: [], // Initialize empty array
          address: {
            street: "",
            city: "",
            state: "",
            postalCode: "",
            country: "Australia",
          },
        },
      });
      console.log(`Migrated user: ${user.email}`);
    }

    console.log("Migration completed");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrateUsers();
