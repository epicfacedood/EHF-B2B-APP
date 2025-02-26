import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/mongodb.js";
import routes from "./routes/index.js";
import userRouter from "./routes/userRoute.js";
import path from "path";
import { fileURLToPath } from "url";

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
app.use("/api", routes);
app.use("/api/user", userRouter);

// Debug 404s at app level
app.use("*", (req, res) => {
  console.log(`App 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: "Not found" });
});

export default app;
