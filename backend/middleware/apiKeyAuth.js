// Simple API key authentication middleware for price list routes
const apiKeyAuth = (req, res, next) => {
  try {
    // Get API key from request header
    const apiKey = req.headers["x-api-key"];

    // For testing - hardcoded API key
    const expectedApiKey =
      process.env.PRICE_LIST_API_KEY || "price-list-api-key-123";

    console.log("🔑 API Key Debug:");
    console.log(`Received API key: ${apiKey || "none"}`);
    console.log(`Expected API key: ${expectedApiKey}`);

    // Check if API key is provided and matches the expected value
    if (!apiKey || apiKey !== expectedApiKey) {
      console.log("❌ API Key auth failed");
      return res.status(401).json({
        success: false,
        message: "Invalid API key",
      });
    }

    console.log("✅ API Key auth successful");
    next();
  } catch (error) {
    console.error("API Key auth error:", error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

export default apiKeyAuth;
