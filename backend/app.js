import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/mongodb.js";
import routes from "./routes/index.js";
import userRouter from "./routes/userRoute.js";
import path from "path";
import { fileURLToPath } from "url";
import priceListRoutes from "./routes/priceListRoute.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.resolve(__dirname, ".env");
console.log(`Loading environment variables from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("Error loading .env file:", result.error);
} else {
  console.log(".env file loaded successfully");
}

// Database config
connectDB();

// Rest object
const app = express();

// Debug middleware - add this before other middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/pricelist", priceListRoutes);
app.use("/api/user", userRouter);
app.use("/api", routes);

// Add these direct routes for testing
app.get("/api/pricelist/test", (req, res) => {
  res.json({ message: "Price list test route is working!" });
});

app.get("/api/pricelist/customer/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    console.log(`Direct route: Looking for customer ID ${customerId}`);

    // Simple response for testing
    res.json({
      success: true,
      message: "Direct route working",
      customerId,
    });
  } catch (error) {
    console.error("Error in direct route:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Debug 404s at app level
app.use("*", (req, res) => {
  console.log(`App 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: "Not found" });
});

export default app;
