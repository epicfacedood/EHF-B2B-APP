// add products to user cart

import userModel from "../models/userModel.js";

const addToCart = async (req, res) => {
  try {
    const userId = req.user._id; // Changed from req.body.userId
    const { itemId, size } = req.body;

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    let cartData = userData.cartData || new Map();

    // Initialize product in cart if not exists
    if (!cartData.has(itemId)) {
      cartData.set(itemId, new Map());
    }

    // Handle size object with uom and quantity
    if (typeof size === "object" && size.uom) {
      const currentQty = cartData.get(itemId).get(size.uom) || 0;
      cartData.get(itemId).set(size.uom, currentQty + (size.quantity || 1));
    }

    // Update user's cart
    await userModel.findByIdAndUpdate(userId, { cartData });

    res.json({ success: true, message: "Added to cart" });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.json({ success: false, message: error.message });
  }
};

//update user cart
const updateCart = async (req, res) => {
  try {
    const userId = req.user._id; // Changed from req.body.userId
    const { itemId, size } = req.body;

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    let cartData = userData.cartData || new Map();

    // Initialize product in cart if not exists
    if (!cartData.has(itemId)) {
      cartData.set(itemId, new Map());
    }

    // Update quantity
    if (typeof size === "object" && size.uom) {
      if (size.quantity > 0) {
        cartData.get(itemId).set(size.uom, size.quantity);
      } else {
        // Remove the UOM entry if quantity is 0
        cartData.get(itemId).delete(size.uom);
        // Remove the product if no UOMs left
        if (cartData.get(itemId).size === 0) {
          cartData.delete(itemId);
        }
      }
    }

    await userModel.findByIdAndUpdate(userId, { cartData });
    res.json({ success: true, message: "Cart updated" });
  } catch (error) {
    console.error("Update cart error:", error);
    res.json({ success: false, message: error.message });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.body;

    console.log("Removing item:", { userId, itemId }); // Debug log

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    let cartData = userData.cartData || new Map();

    // Remove the entire product entry
    if (cartData.has(itemId)) {
      cartData.delete(itemId);
      await userModel.findByIdAndUpdate(userId, { cartData });
      return res.json({ success: true, message: "Item removed from cart" });
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
    const userId = req.user._id; // Changed from req.body.userId

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    const cartData = userData.cartData || new Map();

    // Convert Map to object for response
    const cartObject = {};
    for (const [productId, quantities] of cartData.entries()) {
      cartObject[productId] = Object.fromEntries(quantities);
    }

    res.json({ success: true, cartData: cartObject });
  } catch (error) {
    console.error("Get cart error:", error);
    res.json({ success: false, message: error.message });
  }
};

export { addToCart, updateCart, removeFromCart, getUserCartData };
