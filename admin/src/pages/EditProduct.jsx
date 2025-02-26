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

          // Handle UOM options
          if (productData.uomOptions && productData.uomOptions.length > 0) {
            setUomOptions(productData.uomOptions);
          } else {
            // If no UOM options, create a default one with the base unit
            setUomOptions([{ code: productData.baseUnit || "", qtyPerUOM: 1 }]);
          }

          // Set existing images
          setExistingImages(productData.image || []);
        } else {
          toast.error("Failed to fetch product");
          navigate("/admin/products");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Error fetching product");
        navigate("/admin/products");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, token, backendUrl, navigate]);

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
    if (uomOptions.length > 1) {
      const newUomOptions = uomOptions.filter((_, i) => i !== index);
      setUomOptions(newUomOptions);
    }
  };

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
      const formData = new FormData();
      formData.append("itemName", itemName);
      formData.append("pcode", pcode);
      formData.append("baseUnit", baseUnit);
      formData.append("packagingSize", packagingSize);
      formData.append("bestseller", bestseller);

      // Add UOM options as JSON string
      formData.append("uomOptions", JSON.stringify(validUomOptions));

      // Add new images if provided
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

      if (response.data.success) {
        toast.success(response.data.message);
        navigate("/admin/products");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      toast.error("Failed to update product");
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!product) {
    return <div className="text-center py-10">Product not found</div>;
  }

  return (
    <form onSubmit={onSubmitHandler}>
      <h2 className="text-xl font-semibold mb-4">Edit Product</h2>

      <div>
        <p className="mb-2">Product Images</p>
        <div className="flex gap-2 mb-4">
          {[
            { state: image1, setState: setImage1, index: 0 },
            { state: image2, setState: setImage2, index: 1 },
            { state: image3, setState: setImage3, index: 2 },
            { state: image4, setState: setImage4, index: 3 },
          ].map((img, i) => (
            <label key={i} htmlFor={`image${i + 1}`}>
              <img
                className="w-20 h-20 object-cover border"
                src={
                  img.state
                    ? URL.createObjectURL(img.state)
                    : existingImages[img.index] || assets.upload_area
                }
                alt=""
              />
              <input
                onChange={(e) => img.setState(e.target.files[0])}
                type="file"
                id={`image${i + 1}`}
                hidden
              />
            </label>
          ))}
        </div>
      </div>

      <div className="w-full mb-4">
        <p className="mb-2">Product Name</p>
        <input
          onChange={(e) => setItemName(e.target.value)}
          value={itemName}
          className="w-full max-w-[500px] px-3 py-2 border rounded"
          type="text"
          placeholder="Type here"
          required
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full mb-4">
        <div>
          <p className="mb-2">Product Code (Pcode)</p>
          <input
            onChange={(e) => setPcode(e.target.value)}
            value={pcode}
            className="w-full px-3 py-2 border rounded"
            type="text"
            placeholder="P12345"
            required
          />
        </div>
        <div>
          <p className="mb-2">Base Unit</p>
          <input
            onChange={(e) => setBaseUnit(e.target.value)}
            value={baseUnit}
            className="w-full px-3 py-2 border rounded"
            type="text"
            placeholder="PCS"
            required
          />
        </div>
        <div>
          <p className="mb-2">Packaging Size</p>
          <input
            onChange={(e) => setPackagingSize(e.target.value)}
            value={packagingSize}
            className="w-full px-3 py-2 border rounded"
            type="text"
            placeholder="1kg/10pkt"
            required
          />
        </div>
      </div>

      <div className="mt-4 max-w-[800px] mb-4">
        <div className="flex justify-between items-center mb-2">
          <p className="font-medium">Units of Measure (UOM)</p>
          <button
            type="button"
            onClick={addUomOption}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          >
            + Add UOM
          </button>
        </div>

        {uomOptions.map((option, index) => (
          <div key={index} className="flex flex-wrap gap-2 mb-3 items-center">
            <select
              value={option.code}
              onChange={(e) =>
                handleUomOptionChange(index, "code", e.target.value)
              }
              className="w-32 px-3 py-2 border rounded"
              required
            >
              <option value="" disabled>
                Select UOM
              </option>
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

      <div className="flex gap-2 mt-4 mb-4">
        <input
          onChange={() => setBestSeller((prev) => !prev)}
          checked={bestseller}
          type="checkbox"
          id="bestseller"
        />
        <label className="cursor-pointer" htmlFor="bestseller">
          Bestseller
        </label>
      </div>

      <div className="flex gap-4">
        <button className="px-6 py-2 bg-black text-white rounded" type="submit">
          Update Product
        </button>
        <button
          className="px-6 py-2 bg-gray-200 rounded"
          type="button"
          onClick={() => navigate("/admin/products")}
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
