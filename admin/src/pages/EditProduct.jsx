import React, { useState, useEffect } from "react";
import { assets } from "../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

const EditProduct = ({ token }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [product, setProduct] = useState(null);

  // Form state
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [image3, setImage3] = useState(null);
  const [image4, setImage4] = useState(null);
  const [itemName, setItemName] = useState("");
  const [pcode, setPcode] = useState("");
  const [baseUnit, setBaseUnit] = useState("");
  const [packagingSize, setPackagingSize] = useState("");
  const [bestseller, setBestSeller] = useState(false);
  const [uomOptions, setUomOptions] = useState([{ code: "", qtyPerUOM: 1 }]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // List of available UOMs
  const availableUoms = [
    "CTN",
    "PKT",
    "PCS",
    "KG",
    "GM",
    "LTR",
    "ML",
    "BTL",
    "BOX",
    "BAG",
    "ROLL",
    "SET",
    "CASE",
  ];

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${backendUrl}/api/product/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          const productData = response.data.product;
          setProduct(productData);
          setItemName(productData.itemName || "");
          setPcode(productData.pcode || "");
          setBaseUnit(productData.baseUnit || "");
          setPackagingSize(productData.packagingSize || "");
          setBestSeller(productData.bestseller || false);

          // Set UOM options
          if (productData.uomOptions && productData.uomOptions.length > 0) {
            setUomOptions(productData.uomOptions);
          }

          // Set existing images
          if (productData.image && productData.image.length > 0) {
            setExistingImages(productData.image);
          }
        } else {
          toast.error("Failed to fetch product");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Error fetching product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, token, backendUrl]);

  // Handle removing an existing image
  const handleRemoveImage = (index) => {
    const updatedImages = [...existingImages];
    const removedImage = updatedImages[index];
    updatedImages.splice(index, 1);
    setExistingImages(updatedImages);

    // Track which images to remove on the server
    if (removedImage) {
      setImagesToRemove([...imagesToRemove, removedImage]);
    }
  };

  // Handle UOM option changes
  const handleUomOptionChange = (index, field, value) => {
    const newUomOptions = [...uomOptions];
    if (field === "qtyPerUOM") {
      // Convert to integer and ensure it's at least 1
      const intValue = parseInt(value, 10);
      newUomOptions[index][field] =
        isNaN(intValue) || intValue < 1 ? 1 : intValue;
    } else {
      newUomOptions[index][field] = value;
    }
    setUomOptions(newUomOptions);
  };

  // Add new UOM option
  const addUomOption = () => {
    setUomOptions([...uomOptions, { code: "", qtyPerUOM: 1 }]);
  };

  // Remove UOM option
  const removeUomOption = (index) => {
    const newUomOptions = [...uomOptions];
    newUomOptions.splice(index, 1);
    setUomOptions(newUomOptions);
  };

  // Handle form submission
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    // Validate UOM options
    const validUomOptions = uomOptions.filter(
      (option) => option.code.trim() !== ""
    );
    if (validUomOptions.length === 0) {
      toast.error("At least one UOM option is required");
      return;
    }

    try {
      // Show loading state
      setSubmitting(true);
      const loadingToast = toast.loading("Updating product...");

      const formData = new FormData();
      formData.append("itemName", itemName);
      formData.append("pcode", pcode);
      formData.append("baseUnit", baseUnit);
      formData.append("packagingSize", packagingSize);
      formData.append("bestseller", bestseller);

      // Add UOM options as JSON string
      formData.append("uomOptions", JSON.stringify(validUomOptions));

      // Add existing images to keep
      formData.append("existingImages", JSON.stringify(existingImages));

      // Add images to remove
      formData.append("imagesToRemove", JSON.stringify(imagesToRemove));

      // Add new images
      if (image1) formData.append("image1", image1);
      if (image2) formData.append("image2", image2);
      if (image3) formData.append("image3", image3);
      if (image4) formData.append("image4", image4);

      const response = await axios.post(
        `${backendUrl}/api/product/update/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (response.data.success) {
        toast.success("Product updated successfully");
        // Redirect to products list
        navigate("/list");
      } else {
        toast.error(response.data.message);
        setSubmitting(false);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error(
        "Failed to update product: " +
          (error.response?.data?.message || error.message)
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-red-600">
          Product not found
        </h2>
        <button
          onClick={() => navigate("/list")}
          className="mt-4 px-4 py-2 bg-black text-white"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmitHandler}
      className="p-4 max-w-4xl mx-auto space-y-6"
    >
      <h2 className="text-2xl font-semibold">Edit Product</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-700 mb-2">Product Name</label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Product Code</label>
          <input
            type="text"
            value={pcode}
            onChange={(e) => setPcode(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Base Unit</label>
          <input
            type="text"
            value={baseUnit}
            onChange={(e) => setBaseUnit(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Packaging Size</label>
          <input
            type="text"
            value={packagingSize}
            onChange={(e) => setPackagingSize(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 mb-2">Product Images</label>

        {/* Display existing images */}
        {existingImages.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Current Images:</p>
            <div className="flex flex-wrap gap-4">
              {existingImages.map((img, index) => (
                <div key={index} className="relative">
                  <img
                    src={img}
                    alt={`Product ${index + 1}`}
                    className="w-24 h-24 object-cover border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image upload fields - only show if there are fewer than 4 existing images */}
        {existingImages.length < 4 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {existingImages.length < 1 && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Image 1
                </label>
                <input
                  type="file"
                  onChange={(e) => setImage1(e.target.files[0])}
                  className="w-full text-sm"
                  accept="image/*"
                />
              </div>
            )}
            {existingImages.length < 2 && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Image 2
                </label>
                <input
                  type="file"
                  onChange={(e) => setImage2(e.target.files[0])}
                  className="w-full text-sm"
                  accept="image/*"
                />
              </div>
            )}
            {existingImages.length < 3 && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Image 3
                </label>
                <input
                  type="file"
                  onChange={(e) => setImage3(e.target.files[0])}
                  className="w-full text-sm"
                  accept="image/*"
                />
              </div>
            )}
            {existingImages.length < 4 && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Image 4
                </label>
                <input
                  type="file"
                  onChange={(e) => setImage4(e.target.files[0])}
                  className="w-full text-sm"
                  accept="image/*"
                />
              </div>
            )}
          </div>
        )}

        {existingImages.length >= 4 && (
          <p className="text-sm text-amber-600">
            Maximum number of images reached. Remove an image before adding a
            new one.
          </p>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 mb-2">UOM Options</label>
        <button
          type="button"
          onClick={addUomOption}
          className="mb-2 px-3 py-1 bg-blue-100 rounded hover:bg-blue-200"
        >
          Add UOM Option
        </button>

        {uomOptions.map((option, index) => (
          <div
            key={index}
            className="flex items-center gap-4 mb-2 p-2 border rounded"
          >
            <select
              value={option.code}
              onChange={(e) =>
                handleUomOptionChange(index, "code", e.target.value)
              }
              className="px-3 py-2 border rounded"
              required
            >
              <option value="">Select UOM</option>
              {availableUoms.map((uom) => (
                <option key={uom} value={uom}>
                  {uom}
                </option>
              ))}
            </select>

            <div className="flex items-center">
              <span className="mr-2">Qty per UOM:</span>
              <input
                type="number"
                value={option.qtyPerUOM}
                onChange={(e) =>
                  handleUomOptionChange(index, "qtyPerUOM", e.target.value)
                }
                className="w-20 px-3 py-2 border rounded"
                min="1"
                step="1"
                required
              />
            </div>

            {uomOptions.length > 1 && (
              <button
                type="button"
                onClick={() => removeUomOption(index)}
                className="ml-2 px-2 py-1 bg-red-100 rounded hover:bg-red-200"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <input
          onChange={() => setBestSeller((prev) => !prev)}
          checked={bestseller}
          type="checkbox"
          id="bestseller"
        />
        <label className="cursor-pointer" htmlFor="bestseller">
          Add to bestseller
        </label>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          className="px-6 py-3 bg-black text-white disabled:bg-gray-400"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Updating..." : "Update Product"}
        </button>
        <button
          type="button"
          className="px-6 py-3 bg-gray-200 text-gray-800"
          onClick={() => navigate("/list")}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

EditProduct.propTypes = {
  token: PropTypes.string.isRequired,
};

export default EditProduct;
