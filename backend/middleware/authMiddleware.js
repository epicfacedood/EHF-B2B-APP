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
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No token provided");
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    console.log(`Token found (first 10 chars): ${token.substring(0, 10)}...`);

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded token:", decoded);

      // Handle both proper JSON tokens and string tokens
      let user;

      if (typeof decoded === "object" && (decoded.id || decoded._id)) {
        // Proper JSON token with ID
        const userId = decoded.id || decoded._id;
        user = await User.findById(userId);
        console.log(`Looking up user by ID: ${userId}`);
      } else if (typeof decoded === "object" && decoded.email) {
        // JSON token with email but no ID
        user = await User.findOne({ email: decoded.email });
        console.log(`Looking up user by email: ${decoded.email}`);
      } else if (typeof decoded === "string" && decoded.includes("@")) {
        // String token that looks like an email
        const email =
          decoded.split("@")[0] +
          "@" +
          decoded.split("@")[1].split(/[^a-zA-Z0-9.]/)[0];
        user = await User.findOne({ email });
        console.log(`Looking up user by extracted email: ${email}`);
      } else {
        console.log(`❌ Cannot extract user info from token: ${decoded}`);
        return res
          .status(401)
          .json({ success: false, message: "Invalid token format" });
      }

      if (!user) {
        console.log(`❌ Auth failed: User not found`);
        return res
          .status(401)
          .json({ success: false, message: "Not authorized" });
      }

      console.log(`✅ User authenticated: ${user.name} (${user._id})`);
      req.user = user;
      next();
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ success: false, message: "Not authorized" });
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
