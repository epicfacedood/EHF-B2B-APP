// Route for user login

import userModel from "../models/userModel.js";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

const loginUser = async (req, res) => {
  try {
    const { customerId, password } = req.body;

    const user = await userModel.findOne({ customerId });

    if (!user) {
      return res.json({ success: false, message: "Invalid Customer ID" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = createToken(user._id);
      res.json({
        success: true,
        token,
        name: user.name,
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
      address = {}, // Default empty object for address
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

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with all fields
    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      customerId,
      address: {
        street: address.street || "",
        city: address.city || "",
        state: address.state || "",
        postalCode: address.postalCode || "",
        country: address.country || "Australia",
      },
      productsAvailable: [], // Start with empty array
      cartData: new Map(), // Initialize empty cart
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

export { loginUser, registerUser, adminLogin, getName };
