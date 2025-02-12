import express, { Router } from "express";
import {
  addToCart,
  getUserCartData,
  updateCart,
} from "../controllers/cartController.js";
import authUser from "../middleware/auth.js";

const cartRouter = express.Router();
cartRouter.get("/get", authUser, getUserCartData);
cartRouter.post("/add", authUser, addToCart);
cartRouter.post("/update", authUser, updateCart);

export default cartRouter;
