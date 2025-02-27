// Route for user login

import userModel from "../models/userModel.js";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import PriceList from "../models/priceListModel.js";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || "user",
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
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
      const token = generateToken(user);

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
    const token = generateToken(user);

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

    // Find user by email
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    // Use the proper token generation function
    const token = generateToken(user);

    res.json({
      success: true,
      token,
      name: user.name,
    });
  } catch (error) {
    console.error("Admin login error:", error);
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

// Add this function to check if a user is in the price list
const getUsersWithPriceListInfo = async (req, res) => {
  try {
    const users = await userModel.find({}).sort({ createdAt: -1 });

    // If includePriceListInfo is not requested, return users as is
    if (req.query.includePriceListInfo !== "true") {
      return res.status(200).json({
        success: true,
        users,
      });
    }

    // Get all customer IDs from the price list collection
    const priceLists = await PriceList.find({}, { customerId: 1 });
    const priceListCustomerSet = new Set(priceLists.map((pl) => pl.customerId));

    // Add inPriceList field to each user
    const usersWithPriceListInfo = users.map((user) => {
      const userData = user.toObject();
      userData.inPriceList =
        user.customerId && priceListCustomerSet.has(user.customerId);
      return userData;
    });

    res.status(200).json({
      success: true,
      users: usersWithPriceListInfo,
    });
  } catch (error) {
    console.error("Error fetching users with price list info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// Add this new function to fetch a user by customerId
const getUserByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    const user = await userModel.findOne({ customerId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error fetching user by customer ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message,
    });
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
  getUsersWithPriceListInfo,
  getUserByCustomerId,
};
