import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No authentication token",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Set user info in request
    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      customerId: user.customerId,
    };

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token",
    });
  }
};
