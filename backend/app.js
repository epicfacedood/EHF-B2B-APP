import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/mongodb.js";
import routes from "./routes/index.js";
import userRouter from "./routes/userRoute.js";

// Configure env
dotenv.config();

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
