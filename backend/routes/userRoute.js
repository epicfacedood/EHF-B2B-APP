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
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import authUser from "../middleware/auth.js";

const userRouter = express.Router(); // Call the function to create a new router instance

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/admin", adminLogin);

// Add a new route for getting the user profile
userRouter.get("/name", authenticateToken, getName);

// Admin routes
userRouter.get("/admin/users", authUser, getUsersWithPriceListInfo);
userRouter.get("/admin/:userId", authUser, getUserById);
userRouter.put("/admin/:userId", authUser, updateUser);

userRouter.get("/profile", authUser, getUserProfile);

export default userRouter;
