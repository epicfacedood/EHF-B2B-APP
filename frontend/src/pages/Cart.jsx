import React, { useContext, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import CartTotal from "../components/CartTotal";
import { Link, useNavigate } from "react-router-dom";
import { getProductImage, getFallbackImage } from "../utils/imageUtils";
import NoImage from "../components/NoImage";
import { formatPrice, formatPackagingSize } from "../utils/formatUtils";
import { toast } from "react-toastify";
import EmptyCart from "../components/EmptyCart";

const Cart = () => {
  const navigate = useNavigate();
  const {
    products,
    currency,
    cartItems = {},
    updateQuantity,
    removeFromCart,
  } = useContext(ShopContext);
  const [imageError, setImageError] = useState({});

  const handleQuantityChange = async (productId, uom, newQuantity) => {
    if (newQuantity < 0) return; // Only prevent negative quantities

    try {
      await updateQuantity(productId, newQuantity, uom);
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity");
    }
  };

  const handleImageError = (productId) => {
    setImageError((prev) => ({ ...prev, [productId]: true }));
  };

  // Calculate total with null checks
  const total = Object.entries(cartItems || {}).reduce(
    (acc, [productId, uomData]) => {
      const product = products?.find((p) => p._id === productId);
      if (product) {
        const productTotal = Object.entries(uomData || {}).reduce(
          (sum, [uom, quantity]) => sum + product.price * (quantity || 0),
          0
        );
        return acc + productTotal;
      }
      return acc;
    },
    0
  );

  // Safe check for empty cart
  if (!cartItems || Object.keys(cartItems).length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <Title title="Shopping Cart" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {Object.entries(cartItems).map(([productId, quantities]) => {
            const product = products.find((p) => p._id === productId);
            if (!product) return null;

            return (
              <div
                key={`${productId}-${quantities[0]}`}
                className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded shadow"
              >
                {/* Image section */}
                <div className="w-full sm:w-24 h-40 sm:h-24 flex-shrink-0">
                  {!imageError[productId] ? (
                    <img
                      src={product.image?.[0] || getFallbackImage()}
                      alt={product.itemName}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.src = getFallbackImage();
                        handleImageError(productId);
                      }}
                    />
                  ) : (
                    <NoImage pcode={product.pcode} name={product.itemName} />
                  )}
                </div>

                {/* Product details */}
                <div className="flex-grow">
                  <div>
                    <h3 className="font-medium text-lg">{product.itemName}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {product.pcode}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {product.packagingSize !== "nan" &&
                        formatPackagingSize(product.packagingSize)}
                    </p>
                  </div>

                  {/* Quantities */}
                  <div className="mt-4 space-y-3">
                    {Object.entries(quantities).map(([uom, quantity]) => (
                      <div
                        key={`${productId}-${uom}`}
                        className="flex flex-wrap items-center gap-4"
                      >
                        <span className="w-20 text-sm">{uom}</span>
                        <div className="flex items-center gap-2">
                          {/* Quantity Controls */}
                          <div className="flex items-center border rounded">
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  productId,
                                  uom,
                                  quantity - 1
                                )
                              }
                              className="m-1 w-6 h-6 rounded border flex items-center justify-center text-sm bg-black text-white"
                            >
                              -
                            </button>
                            <span className="w-8 text-center">{quantity}</span>
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  productId,
                                  uom,
                                  quantity + 1
                                )
                              }
                              className="m-1 w-6 h-6 rounded border flex items-center justify-center text-sm bg-black text-white"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-gray-600 min-w-[80px]">
                            {currency}
                            {formatPrice(product.price * quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Remove button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => removeFromCart(product._id, quantities[0])}
                    className="text-red-500 hover:text-red-600 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cart summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-4 rounded shadow sticky top-4">
            <div className="flex justify-between mb-4">
              <span className="text-lg">Subtotal</span>
              <span className="text-lg font-medium">
                {currency}
                {formatPrice(total)}
              </span>
            </div>
            <button
              onClick={() => navigate("/place-order")}
              className="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
