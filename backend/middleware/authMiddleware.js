import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

// Add this at the top of the file for debugging
const debugAuth = (req) => {
  console.log("🔐 Auth Debug:");
  console.log(`URL: ${req.originalUrl}`);
  console.log(`Headers: ${JSON.stringify(req.headers)}`);
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    console.log(`Token found (first 10 chars): ${token.substring(0, 10)}...`);
  } else {
    console.log("No Authorization header found");
  }
};

// Auth middleware
export const isAuth = async (req, res, next) => {
  try {
    // Add debug logging
    debugAuth(req);

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Auth failed: No Bearer token");
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      console.log("❌ Auth failed: Token extraction failed");
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`✅ Token verified for user ID: ${decoded.id}`);

      const user = await User.findById(decoded.id);

      if (!user) {
        console.log(`❌ Auth failed: User not found for ID: ${decoded.id}`);
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      console.log(`✅ Auth successful for user: ${user.name}`);
      req.user = user;
      next();
    } catch (jwtError) {
      console.log(`❌ JWT verification failed: ${jwtError.message}`);
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }
};

// Admin middleware
export const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(403).json({
      success: false,
      message: "Not authorized as admin",
    });
  }
};
