import React, { useContext, useState } from "react";
import PropTypes from "prop-types";
import { getProductImage, getFallbackImage } from "../utils/imageUtils";
import { Link } from "react-router-dom";
import NoImage from "./NoImage";
import { formatPrice, formatPackagingSize } from "../utils/formatUtils";
import { ShopContext } from "../contexts/ShopContext";

const ProductCard = ({ product, currency = "$" }) => {
  const { _id, pcode, itemName, packagingSize, price, uoms = [] } = product;
  const { addToCart } = useContext(ShopContext);
  const [quantity, setQuantity] = useState(0);
  const [selectedUOM, setSelectedUOM] = useState(uoms[0] || "");

  const handleQuantityAdjust = (increment) => {
    const newValue = increment ? quantity + 1 : Math.max(0, quantity - 1);
    setQuantity(newValue);
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    const newQuantity = value === "" ? "" : Math.max(0, parseInt(value) || 0);
    setQuantity(newQuantity);
  };

  const handleAddToCart = () => {
    if (quantity > 0 && selectedUOM) {
      addToCart(_id, {
        quantity,
        uom: selectedUOM,
      });
      setQuantity(0);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <Link to={`/product/${_id}`} className="block">
        <div className="w-48 h-48 sm:w-32 sm:h-32 mx-auto mb-4">
          <img
            src={getProductImage(pcode)}
            alt={itemName}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "block";
            }}
          />
          <div style={{ display: "none" }}>
            <NoImage pcode={pcode} name={itemName} />
          </div>
        </div>

        <div className="space-y-3 text-center px-2">
          <h3 className="text-lg sm:text-base font-medium">{itemName}</h3>
          <p className="text-sm text-gray-600">{pcode}</p>
          <p className="text-sm text-gray-500">
            {formatPackagingSize(packagingSize)}
          </p>
          <p className="text-lg sm:text-sm font-medium">
            {currency}
            {formatPrice(price)}
          </p>
        </div>
      </Link>

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-1.5">
          {uoms.map((uom) => (
            <button
              key={uom}
              onClick={() => setSelectedUOM(uom)}
              className={`px-4 py-1.5 sm:px-2.5 sm:py-1 text-sm sm:text-xs rounded-lg ${
                selectedUOM === uom
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {uom}
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center justify-center gap-2">
          <input
            type="number"
            min="0"
            value={quantity || ""}
            onChange={handleQuantityChange}
            className="w-20 px-2 py-1 text-sm border rounded text-center"
            placeholder="Qty"
          />
          <button
            onClick={handleAddToCart}
            disabled={quantity === 0 || !selectedUOM}
            className={`px-3 py-1 text-xs rounded ${
              quantity === 0 || !selectedUOM
                ? "bg-gray-200 text-gray-500"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            Add
          </button>
        </div>

        <div className="flex sm:hidden items-center justify-center gap-2">
          <div className="flex items-center border rounded-lg">
            <button
              onClick={() => handleQuantityAdjust(false)}
              className="w-10 py-2 text-gray-600 hover:bg-gray-100 border-r text-lg font-medium"
            >
              -
            </button>
            <input
              type="number"
              min="0"
              value={quantity || ""}
              onChange={handleQuantityChange}
              className="w-14 py-2 text-center text-base focus:outline-none"
            />
            <button
              onClick={() => handleQuantityAdjust(true)}
              className="w-10 py-2 text-gray-600 hover:bg-gray-100 border-l text-lg font-medium"
            >
              +
            </button>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={quantity === 0 || !selectedUOM}
            className={`px-4 py-2 text-sm rounded-lg ${
              quantity === 0 || !selectedUOM
                ? "bg-gray-200 text-gray-500"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    pcode: PropTypes.string.isRequired,
    itemName: PropTypes.string.isRequired,
    packagingSize: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    uoms: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  currency: PropTypes.string,
};

ProductCard.defaultProps = {
  product: {
    packagingSize: "",
  },
  currency: "$",
};

export default ProductCard;
