import app from "./app.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 4000;

// Simplified server startup without retries
app
  .listen(PORT, () => {
    console.log(`Server Running on port ${PORT}`);
  })
  .on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is already in use. Please:
    1. Kill all node processes: killall -9 node
    2. Or use a different port in .env file
    3. Or wait a few minutes and try again`);
      process.exit(1);
    } else {
      console.error("Server error:", error);
      process.exit(1);
    }
  });
