import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";

//App Config
const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

//CORS configuration
//This works! But allowing any origin to access the
// credentials poses a security risk.
const corsOptions = {
  origin: [
    "https://ecommerce-frontend-theta-blue.vercel.app", //FRONTEND LIVE WEBAPP ON VERCEL
    "https://ecommerce-admin-omega-nine.vercel.app", //ADMIN LIVE WEBAPP ON VERCEL
    "http://localhost:3000", // for local development
    "http://localhost:5173", // for Vite's default port
    "http://localhost:5174",
  ],
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

// Middlewares
app.use(express.json());
app.use(cors(corsOptions));

// api endpoints
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

app.listen(port, () => {
  console.log("Server started on PORT: " + port);
});
