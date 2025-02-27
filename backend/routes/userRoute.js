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

export default userRouter;
