import React, { useContext, useState, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { getProductImage, getFallbackImage } from "../utils/imageUtils";
import NoImage from "./NoImage";
import { formatPrice, formatPackagingSize } from "../utils/formatUtils";
import { toast } from "react-toastify";

const ProductItem = ({
  id,
  name = "No name",
  price = 0,
  pcode = "No code",
  uoms = "[]",
  packagingSize,
  image = [],
}) => {
  const { currency, addToCart } = useContext(ShopContext);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedUOM, setSelectedUOM] = useState("");
  const [quantity, setQuantity] = useState(0);

  console.log("Product image data:", { pcode, image });

  // Add debug logging at the start of component
  useEffect(() => {
    console.log("ProductItem received props:", {
      pcode,
      image,
      firstImage: image?.[0],
    });
  }, [pcode, image]);

  // Parse UOMs safely - handle the JSON string format
  const uomsArray = React.useMemo(() => {
    try {
      // If it's already an array, return it
      if (Array.isArray(uoms)) return uoms;
      // Parse the JSON string but don't modify the data
      const parsed = JSON.parse(uoms || "[]");
      return parsed;
    } catch (error) {
      console.error("Error parsing UOMs:", error);
      return [];
    }
  }, [uoms]);

  // Set initial UOM if not set and options are available
  React.useEffect(() => {
    if (uomsArray.length > 0 && !selectedUOM) {
      setSelectedUOM(uomsArray[0]);
    }
  }, [uomsArray, selectedUOM]);

  const handleQuantityAdjust = (increment) => {
    const newValue = increment ? quantity + 1 : Math.max(0, quantity - 1);
    setQuantity(newValue);
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    const newQuantity = value === "" ? "" : Math.max(0, parseInt(value) || 0);
    setQuantity(newQuantity);
  };

  const handleAddToCart = async () => {
    if (quantity <= 0) {
      toast.error("Please select a quantity");
      return;
    }

    if (!selectedUOM) {
      toast.error("Please select a unit of measure");
      return;
    }

    try {
      await addToCart(id, {
        uom: selectedUOM,
        quantity: quantity,
      });
      toast.success("Item added to cart");

      setQuantity(0); // Reset quantity after successful add
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add item to cart");
    }
  };

  const formatProductName = (name) => {
    const parts = name.split(/[()（）]/);
    return {
      mainName: parts[0].trim(),
      details: parts.slice(1).join(" ").trim(),
    };
  };

  const { mainName, details } = formatProductName(name);

  // Add debug logging for image props
  useEffect(() => {
    console.log("Product image props:", {
      pcode,
      imageArray: image,
      firstImage: image?.[0],
      fallbackImage: getFallbackImage(),
    });
  }, [pcode, image]);

  return (
    <div className="text-gray-700 border rounded-sm bg-white shadow-md hover:shadow-lg transition-shadow duration-300 w-full sm:max-w-[280px] mx-auto p-4">
      <Link
        to={`/product/${id}`}
        className="block mx-auto w-48 h-48 sm:w-32 sm:h-32 relative mb-4"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="loader"></div>
          </div>
        )}
        {!imageError ? (
          <img
            className="w-full h-full object-contain hover:scale-110 transition-transform duration-300 ease-in-out"
            src={image?.[0] || getFallbackImage()}
            alt={name}
            onLoad={() => {
              setLoading(false);
            }}
            onError={(e) => {
              console.error("Image load error for:", {
                pcode,
                attemptedSrc: e.target.src,
                imageArray: image,
              });
              // Use placeholder image on error
              e.target.src = getFallbackImage();
              setLoading(false);
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={getFallbackImage()}
              alt={name}
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </Link>

      <div className="space-y-3 text-center px-2">
        <p className="text-sm text-gray-500">{pcode}</p>
        <div className="space-y-1">
          <p className="text-lg sm:text-base font-semibold leading-tight">
            {mainName}
          </p>
          {details && <p className="text-sm text-gray-600">{details}</p>}
        </div>
        <p className="text-sm text-gray-500">
          {
            packagingSize &&
            formatPackagingSize(packagingSize) &&
            packagingSize !== "nan"
              ? formatPackagingSize(packagingSize)
              : "\u00A0" // Non-breaking space
          }
        </p>
        <p className="text-lg sm:text-sm font-medium">
          {currency}
          {formatPrice(price)}
        </p>

        <div className="flex flex-wrap justify-center gap-1">
          {uomsArray.map((unit) => (
            <button
              key={unit}
              onClick={() => setSelectedUOM(unit)}
              className={`px-2 py-1 text-xs rounded ${
                selectedUOM === unit
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {unit.replace(/["[\]]/g, "")}
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center justify-center gap-2">
          <input
            type="number"
            min="0"
            value={quantity || ""}
            onChange={handleQuantityChange}
            className="w-16 px-2 py-1 text-sm border rounded text-center"
            placeholder="Qty"
          />
          <button
            onClick={handleAddToCart}
            disabled={quantity === 0}
            className={`px-3 py-1 text-xs rounded ${
              quantity === 0
                ? "bg-gray-200 text-gray-500"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            Add
          </button>
        </div>

        <div className="flex sm:hidden items-center justify-center gap-1 pt-1">
          <div className="flex items-center border rounded">
            <button
              onClick={() => handleQuantityAdjust(false)}
              className="w-8 py-1 text-gray-600 hover:bg-gray-100 border-r text-base"
            >
              -
            </button>
            <input
              type="number"
              min="0"
              value={quantity || ""}
              onChange={handleQuantityChange}
              className="w-12 py-1 text-center text-sm focus:outline-none"
            />
            <button
              onClick={() => handleQuantityAdjust(true)}
              className="w-8 py-1 text-gray-600 hover:bg-gray-100 border-l text-base"
            >
              +
            </button>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={quantity === 0}
            className={`px-3 py-1 text-xs rounded ${
              quantity === 0
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

ProductItem.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string,
  price: PropTypes.number,
  pcode: PropTypes.string,
  uoms: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  packagingSize: PropTypes.string,
  image: PropTypes.array,
};

export default ProductItem;
