import express from "express";
import userRouter from "./userRoute.js";
import productRouter from "./productRoute.js";
import cartRouter from "./cartRoute.js";
import orderRouter from "./orderRoute.js";
// import authRoutes from "./authRoutes.js";
import { isAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Debug middleware for all API routes
router.use((req, res, next) => {
  console.log("🌐 API Request:", {
    method: req.method,
    url: req.originalUrl,
    path: req.path,
  });
  next();
});

// Mount routes
router.use("/user", userRouter);
router.use("/product", productRouter);
router.use("/cart", cartRouter);
router.use("/order", orderRouter);
// Remove or comment out the auth routes mounting
// router.use("/auth", authRoutes);

// IMPORTANT: Remove or comment out the catch-all 404 handler from here
// It should only be in app.js, not in the index.js router
// router.use((req, res) => {
//   console.log("❌ API route not found:", req.method, req.originalUrl);
//   res.status(404).json({
//     message: "API route not found",
//     requestedPath: req.originalUrl,
//   });
// });

export default router;
