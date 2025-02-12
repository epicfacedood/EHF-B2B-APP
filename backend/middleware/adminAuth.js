import jwt from "jsonwebtoken";

const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        messsage: "No valid token, not authorised. Please log in again.",
      });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, `${process.env.JWT_SECRET}`);
      req.user = decoded;
      next();
      if (decoded !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
        return res.json({
          success: false,
          message: "admin not logged in, not authorised login again",
        });
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid token, not authorised. Please login again.",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export default adminAuth;
