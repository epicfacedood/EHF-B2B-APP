import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js"; // Ensure this path is correct

// Middleware to authenticate token
const authenticateToken = async (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await userModel.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    next();
  } catch (error) {
    res.status(400).json({ success: false, message: "Invalid token" });
  }
};

export { authenticateToken };
