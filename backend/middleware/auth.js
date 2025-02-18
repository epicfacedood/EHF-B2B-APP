import jwt from "jsonwebtoken";

const authUser = async (req, res, next) => {
  try {
    // Check if Authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No authorization header",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, please login again",
      });
    }

    // Verify token and get user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Set both req.user._id and req.body.userId for backward compatibility
    req.user = { _id: decoded.id };
    req.body.userId = decoded.id;
    req.userId = decoded.id;

    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token, please login again",
    });
  }
};

export default authUser;
