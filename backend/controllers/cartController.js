// add products to user cart

import userModel from "../models/userModel.js";

const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId, size } = req.body;

    console.log("Adding to cart:", { itemId, size }); // Debug log

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    // Initialize cartData if it doesn't exist
    if (!user.cartData) {
      user.cartData = {};
    }

    // Initialize product entry if it doesn't exist
    if (!user.cartData[itemId]) {
      user.cartData[itemId] = {};
    }

    // Add or update the quantity for the specific UOM
    const currentQty = user.cartData[itemId][size.uom] || 0;
    user.cartData[itemId][size.uom] = currentQty + size.quantity;

    console.log("Updated cart data:", user.cartData); // Debug log

    // Mark cartData as modified since we're updating a nested object
    user.markModified("cartData");
    await user.save();

    res.json({
      success: true,
      cartData: user.cartData,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

//update user cart
const updateCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId, size } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    // Initialize cartData if it doesn't exist
    if (!user.cartData) {
      user.cartData = {};
    }

    if (size.quantity === 0) {
      // Remove the UOM if quantity is 0
      if (user.cartData[itemId]) {
        delete user.cartData[itemId][size.uom];
        // Remove the product if no UOMs left
        if (Object.keys(user.cartData[itemId]).length === 0) {
          delete user.cartData[itemId];
        }
      }
    } else {
      // Initialize product entry if it doesn't exist
      if (!user.cartData[itemId]) {
        user.cartData[itemId] = {};
      }
      // Update the quantity for the specific UOM
      user.cartData[itemId][size.uom] = size.quantity;
    }

    // Mark cartData as modified and save
    user.markModified("cartData");
    await user.save();

    res.json({
      success: true,
      cartData: user.cartData,
    });
  } catch (error) {
    console.error("Update cart error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.body;

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    // Change this to use plain object instead of Map
    let cartData = userData.cartData || {};

    // Update to use object methods instead of Map methods
    if (cartData[itemId]) {
      delete cartData[itemId];
      userData.cartData = cartData;
      await userData.save();
      return res.json({
        success: true,
        message: "Item removed from cart",
        cartData,
      });
    }

    return res.json({ success: false, message: "Item not found in cart" });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// get user cart data
const getUserCartData = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      cartData: user.cartData || {},
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export { addToCart, updateCart, removeFromCart, getUserCartData };
