import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import RelatedProducts from "../components/RelatedProducts";
import { getProductImage, getFallbackImage } from "../utils/imageUtils";
import NoImage from "../components/NoImage";
import { toast } from "react-toastify";

const Product = () => {
  const { productId } = useParams();
  const { products, currency, addToCart } = useContext(ShopContext);
  const [productData, setProductData] = useState(null);
  const [currentImage, setCurrentImage] = useState("");
  const [imageError, setImageError] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedUOM, setSelectedUOM] = useState("");
  const [quantity, setQuantity] = useState("");

  // Function to parse uoms string to an array
  const getUOMsArray = (uoms) => {
    if (!uoms) return [];
    if (Array.isArray(uoms)) return uoms;
    try {
      return JSON.parse(uoms);
    } catch (e) {
      console.error("Error parsing uoms:", e);
      return [];
    }
  };

  useEffect(() => {
    const fetchProductData = () => {
      const product = products.find((item) => item._id === productId);
      if (product) {
        setProductData(product);
        setCurrentImage(product.image?.[0] || getFallbackImage());
        const uomsArray = getUOMsArray(product.uoms);
        if (uomsArray.length > 0) {
          setSelectedUOM(uomsArray[0]);
        }
      }
    };

    fetchProductData();
  }, [products, productId]);

  const handleImageError = (index) => {
    setImageError((prev) => ({ ...prev, [index]: true }));
  };

  const handleQuantityChange = (e) => {
    const value =
      e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value) || 0);
    setQuantity(value);
  };

  const handleAddToCart = () => {
    if (quantity > 0 && selectedUOM) {
      addToCart(productData._id, {
        quantity,
        uom: selectedUOM,
      });
      toast.success("Item added to cart");
      setQuantity("");
    } else {
      toast.error("Please enter a valid quantity");
    }
  };

  if (!productData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  console.log("Product category:", productData.category);

  return (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">
      {/* Product data */}
      <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">
        {/* Product Images */}
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          {/* Thumbnail Images */}
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full">
            {productData.image?.map((imageUrl, index) => (
              <div
                key={index}
                className={`w-20 h-20 border rounded-md overflow-hidden cursor-pointer ${
                  imageError[index] ? "hidden" : ""
                }`}
                onClick={() => setCurrentImage(imageUrl)}
              >
                <img
                  src={imageUrl}
                  alt={`${productData.name} ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(index)}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-4 mb-8">
            {/* Main Image */}
            <img
              src={currentImage || getFallbackImage()}
              alt={productData.name}
              className="w-full h-auto object-cover rounded-md mb-4"
              onError={() => setImageError(true)}
            />
          </div>
        </div>
        {/* Product information */}
        <div className="flex-1">
          <p className="text-gray-500 mb-2">{productData.pcode}</p>
          <h1 className="text-4xl font-medium mb-2">{productData.itemName}</h1>
          {productData.packagingSize && (
            <p className="text-lg text-gray-600 mb-4">
              {productData.packagingSize !== "nan"
                ? productData.packagingSize
                : "-"}
            </p>
          )}
          <p className="text-2xl font-medium mb-6">
            {currency}
            {productData.price}
          </p>
          <p className="text-gray-700 md:w-4/5 mb-8">
            {productData.description}
          </p>

          {/* Product Details */}
          <div className="bg-gray-50 p-4 rounded-lg mb-8 md:w-4/5">
            <h3 className="font-medium mb-3">Product Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Product Code</p>
                <p>{productData.pcode}</p>
              </div>
              <div>
                <p className="text-gray-500">Packaging</p>
                <p>{productData.packagingSize || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Unit of Measure</p>
                <p>
                  {getUOMsArray(productData.uoms)
                    .map((uom) => uom.replace(/["[\]]/g, ""))
                    .join(", ") || "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Carton Quantity</p>
                <p>{productData.cartonQuantity || "-"}</p>
              </div>
            </div>
          </div>

          {/* UOM Selection */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Select Unit of Measure</p>
            <div className="flex gap-2">
              {getUOMsArray(productData.uoms).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setSelectedUOM(unit)}
                  className={`px-4 py-2 text-sm rounded ${
                    selectedUOM === unit
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {unit.replace(/["[\]]/g, "")}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity and Add to Cart Section */}
          <div className="flex gap-4 items-center mt-5">
            <div className="flex items-center gap-2">
              <label htmlFor="quantity" className="text-sm font-medium">
                Quantity:
              </label>
              <input
                id="quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={handleQuantityChange}
                className="w-24 px-3 py-2 text-sm border rounded text-center"
                placeholder="Qty"
              />
            </div>
            <button
              onClick={handleAddToCart}
              disabled={quantity === 0}
              className={`px-8 py-2 text-sm rounded ${
                quantity === 0
                  ? "bg-gray-200 text-gray-500"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              Add to Cart
            </button>
          </div>

          {productData.sizes?.length > 0 && (
            <div className="flex flex-col gap-4 my-8">
              <p>Select size</p>
              <div className="flex gap-2">
                {productData.sizes.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedSize(item)}
                    className={`border py-2 px-4 rounded transition-all duration-200 ${
                      item === selectedSize
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Move RelatedProducts here, outside the product info section */}
      {productData.category && (
        <div className="mt-16">
          <RelatedProducts
            category={productData.category}
            subCategory={productData.subCategory || ""}
          />
        </div>
      )}
    </div>
  );
};

export default Product;
