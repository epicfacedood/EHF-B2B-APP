import express from "express";
import {
  loginUser,
  registerUser,
  adminLogin,
  getName,
} from "../controllers/userController.js";
import authUser from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/admin-login", adminLogin);

// Protected routes
router.get("/name", authUser, getName);

export default router;
