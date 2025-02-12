import express from "express";
import {
  loginUser,
  registerUser,
  adminLogin,
  getName,
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const userRouter = express.Router(); // Call the function to create a new router instance

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/admin", adminLogin);

// Add a new route for getting the user profile
userRouter.get("/name", authenticateToken, getName);

export default userRouter;
