import dotenv from "dotenv";
dotenv.config();

const apiKeyAuth = (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];
    const validApiKey = process.env.PRICE_LIST_API_KEY;

    if (!validApiKey) {
      console.error("No API key configured in environment variables");
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    if (!apiKey || apiKey !== validApiKey) {
      return res.status(401).json({
        success: false,
        message: "Invalid API key",
      });
    }

    next();
  } catch (error) {
    console.error("Error in API key auth:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during authentication",
    });
  }
};

export default apiKeyAuth;
