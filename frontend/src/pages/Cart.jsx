import React, { useContext, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import CartTotal from "../components/CartTotal";
import { Link, useNavigate } from "react-router-dom";
import { getProductImage } from "../utils/imageUtils";
import NoImage from "../components/NoImage";
import { formatPrice, formatPackagingSize } from "../utils/formatUtils";
import { toast } from "react-toastify";

const EmptyCart = () => (
  <div className="text-center py-8">
    <h2 className="text-2xl mb-4">Your cart is empty</h2>
    <Link to="/" className="text-blue-500 hover:text-blue-600">
      Continue Shopping
    </Link>
  </div>
);

const Cart = () => {
  const navigate = useNavigate();
  const { products, currency, cartItems, updateQuantity } =
    useContext(ShopContext);
  const [imageError, setImageError] = useState({});

  const handleQuantityAdjust = (productId, currentValue, uom, increment) => {
    const newValue = increment
      ? currentValue + 1
      : Math.max(0, currentValue - 1);
    handleQuantityChange(productId, newValue, uom);
  };

  const handleQuantityChange = (productId, value, uom) => {
    const newQuantity = value === "" ? "" : Math.max(0, parseInt(value) || 0);
    if (newQuantity !== null) {
      updateQuantity(productId, newQuantity, uom);
    }
  };

  const handleImageError = (productId) => {
    setImageError((prev) => ({ ...prev, [productId]: true }));
  };

  // Calculate total
  const total = Object.entries(cartItems).reduce(
    (acc, [productId, uomData]) => {
      const product = products.find((p) => p._id === productId);
      if (product) {
        const productTotal = Object.entries(uomData).reduce(
          (sum, [uom, quantity]) => sum + product.price * quantity,
          0
        );
        return acc + productTotal;
      }
      return acc;
    },
    0
  );

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {cartItems && Object.keys(cartItems).length === 0 ? (
        <EmptyCart />
      ) : (
        <div>
          <Title title="Shopping Cart" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {Object.entries(cartItems).map(([productId, quantities]) => {
                const product = products.find((p) => p._id === productId);
                if (!product) return null;

                return (
                  <div
                    key={productId}
                    className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded shadow"
                  >
                    {/* Image section */}
                    <div className="w-full sm:w-24 h-40 sm:h-24 flex-shrink-0">
                      {!imageError[productId] ? (
                        <img
                          src={getProductImage(product.pcode)}
                          alt={product.itemName}
                          className="w-full h-full object-contain"
                          onError={() => handleImageError(productId)}
                        />
                      ) : (
                        <NoImage
                          pcode={product.pcode}
                          name={product.itemName}
                        />
                      )}
                    </div>

                    {/* Product details */}
                    <div className="flex-grow">
                      <div>
                        <h3 className="font-medium text-lg">
                          {product.itemName}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {product.pcode}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatPackagingSize(product.packagingSize)}
                        </p>
                      </div>

                      {/* Quantities */}
                      <div className="mt-4 space-y-3">
                        {Object.entries(quantities).map(([uom, quantity]) => (
                          <div
                            key={uom}
                            className="flex flex-wrap items-center gap-4"
                          >
                            <span className="w-20 text-sm">{uom}</span>
                            <div className="flex items-center gap-2">
                              {/* Quantity Controls */}
                              <div className="flex items-center border rounded">
                                <button
                                  onClick={() =>
                                    handleQuantityAdjust(
                                      productId,
                                      quantity,
                                      uom,
                                      false
                                    )
                                  }
                                  className="px-3 py-1 text-gray-600 hover:bg-gray-100 border-r"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={quantity || ""}
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      productId,
                                      e.target.value,
                                      uom
                                    )
                                  }
                                  className="w-16 px-2 py-1 text-center focus:outline-none"
                                />
                                <button
                                  onClick={() =>
                                    handleQuantityAdjust(
                                      productId,
                                      quantity,
                                      uom,
                                      true
                                    )
                                  }
                                  className="px-3 py-1 text-gray-600 hover:bg-gray-100 border-l"
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
      )}
    </div>
  );
};

export default Cart;
