import express from "express";
import {
  loginUser,
  registerUser,
  adminLogin,
  getName,
  getAllUsers,
  getUserById,
  updateUser,
  getUserProfile,
  getUsersWithPriceListInfo,
  getUserByCustomerId,
} from "../controllers/userController.js";
import { isAuth, isAdmin } from "../middleware/authMiddleware.js";
import authUser from "../middleware/auth.js";
import User from "../models/userModel.js";

const userRouter = express.Router(); // Call the function to create a new router instance

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/admin", adminLogin);

// Add a new route for getting the user profile
userRouter.get("/name", isAuth, getName);

// Admin routes
userRouter.get("/admin/users", authUser, getUsersWithPriceListInfo);
userRouter.get("/admin/:userId", authUser, getUserById);
userRouter.put("/admin/:userId", authUser, updateUser);

userRouter.get("/profile", authUser, getUserProfile);

userRouter.get("/admin/customer/:customerId", isAuth, getUserByCustomerId);

userRouter.get("/latest-profile", authUser, async (req, res) => {
  try {
    const { userId, email } = req.query;

    // Find the user by ID or email in the MongoDB database
    const user = await User.findOne({
      $or: [{ _id: userId }, { email: email }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in database",
      });
    }

    // Return the user with the latest data
    res.json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error("Error fetching latest user profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default userRouter;
