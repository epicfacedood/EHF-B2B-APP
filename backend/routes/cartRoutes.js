import express from "express";
import {
  addToCart,
  updateCart,
  removeFromCart,
  getUserCartData,
} from "../controllers/cartController.js";
import authUser from "../middleware/auth.js";

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
  console.log("🛒 Cart route hit:", {
    method: req.method,
    path: req.path,
    userId: req.user?._id,
    auth: !!req.headers.authorization,
    body: req.body,
  });
  next();
});

// All cart routes require authentication
router.use(authUser);

// Cart routes
router.post("/add", addToCart);
router.post("/update", updateCart);
router.post("/remove", removeFromCart);
router.get("/get", getUserCartData);

// Debug 404 handler for cart routes
router.use((req, res) => {
  console.log("⚠️ Cart route not found:", req.method, req.originalUrl);
  res.status(404).json({
    message: "Cart route not found",
    requestedMethod: req.method,
    requestedPath: req.path,
  });
});

export default router;
