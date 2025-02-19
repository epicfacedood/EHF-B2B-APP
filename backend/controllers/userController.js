// Route for user login

import userModel from "../models/userModel.js";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

const loginUser = async (req, res) => {
  try {
    const { customerId, password } = req.body;
    console.log("Login attempt for customerId:", customerId);

    const user = await userModel.findOne({ customerId });
    if (!user) {
      return res.json({ success: false, message: "Invalid Customer ID" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch);

    if (isMatch) {
      const token = createToken(user._id);

      // Send a consistent response
      res.json({
        success: true,
        token,
        name: user.name,
        productsAvailable: user.productsAvailable || [],
        message: "Login successful",
      });
    } else {
      res.json({ success: false, message: "Invalid password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.json({ success: false, message: "Login failed. Please try again." });
  }
};

// Route for user registration

const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      customerId,
      phone,
      company,
      address = {},
    } = req.body;

    // checking if the user already exists
    const exists = await userModel.findOne({
      $or: [
        { email },
        { customerId: customerId || null }, // Check customerId if provided
      ],
    });

    if (exists) {
      return res.json({
        success: false,
        message:
          exists.email === email
            ? "Email already registered"
            : "Customer ID already exists",
      });
    }

    // validating email format and strong password
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // Create new user with all fields (password will be hashed by the model)
    const newUser = new userModel({
      name,
      email,
      password, // Pass the plain password, let the model hash it
      customerId,
      phone,
      company,
      address: {
        street: address.street || "",
        postalCode: address.postalCode || "",
      },
      productsAvailable: [],
      cartData: {},
    });

    const user = await newUser.save();
    const token = createToken(user._id);

    // Return success without sensitive data
    res.json({
      success: true,
      token,
      user: {
        name: user.name,
        email: user.email,
        customerId: user.customerId,
        phone: user.phone,
        company: user.company,
        address: user.address,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
};

// Route for admin login

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(email + password, `${process.env.JWT_SECRET}`);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const getUserCartData = async (req, res) => {
  try {
    const { userId } = req.body; // Extract userId from route
    console.log("user id is being logged:", userId);
    if (!userId) {
      throw new Error("userId is undefined");
    }

    const userData = await userModel.findById(userId);
    if (!userData) {
      throw new Error("User not found");
    }

    let cartData = userData.cartData; // Access cartData from userData

    res.json({ success: true, cartData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const getName = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await userModel.findById(userId).select("name");

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      name: user.name,
    });
  } catch (error) {
    console.error("Get name error:", error);
    res.json({
      success: false,
      message: "Failed to get user name",
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await userModel
      .find({})
      .select("-password -cartData")
      .sort({ createdAt: -1 });

    console.log(
      "Found users:",
      users.map((u) => ({ id: u._id, name: u.name }))
    );

    if (!users) {
      return res.status(404).json({
        success: false,
        message: "No users found",
      });
    }

    res.json({
      success: true,
      users: users.map((user) => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        customerId: user.customerId,
        createdAt: user.createdAt,
        productsAvailable: user.productsAvailable || [],
      })),
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Getting user with ID:", userId);

    if (!userId || userId === "undefined") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID provided" });
    }

    const user = await userModel.findById(userId).select("-password -cartData");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Ensure default values are set
    user.phone = user.phone || "";
    user.company = user.company || "";
    user.address = user.address || "";
    user.productsAvailable = user.productsAvailable || [];

    res.json({ success: true, user });
  } catch (error) {
    console.error("Error in getUserById:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await userModel.findByIdAndUpdate(
      req.params.userId,
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          productsAvailable: req.body.productsAvailable,
        },
      },
      { new: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware
    const user = await userModel.findById(userId).select("-password");

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        company: user.company,
        address: user.address.street || "",
        postalCode: user.address.postalCode || "",
      },
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.json({ success: false, message: error.message });
  }
};

export {
  loginUser,
  registerUser,
  adminLogin,
  getName,
  getAllUsers,
  getUserById,
  updateUser,
  getUserProfile,
};
