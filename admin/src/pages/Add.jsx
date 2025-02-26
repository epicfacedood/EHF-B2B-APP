import React from "react";
import { assets } from "../assets/assets";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

const Add = ({ token }) => {
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [image3, setImage3] = useState(null);
  const [image4, setImage4] = useState(null);

  const [itemName, setItemName] = useState("");
  const [pcode, setPcode] = useState("");
  const [baseUnit, setBaseUnit] = useState("");
  const [packagingSize, setPackagingSize] = useState("");
  const [bestseller, setBestSeller] = useState(false);

  // UOM Options state
  const [uomOptions, setUomOptions] = useState([{ code: "", qtyPerUOM: 1 }]);

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

      // Add images
      if (image1) formData.append("image1", image1);
      if (image2) formData.append("image2", image2);
      if (image3) formData.append("image3", image3);
      if (image4) formData.append("image4", image4);

      // Log the form data for debugging
      console.log("UOM Options being sent:", validUomOptions);
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await axios.post(
        `${backendUrl}/api/product/add`,
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
        setItemName("");
        setPcode("");
        setBaseUnit("");
        setPackagingSize("");
        setImage1(null);
        setImage2(null);
        setImage3(null);
        setImage4(null);
        setUomOptions([{ code: "", qtyPerUOM: 1 }]);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      toast.error("Failed to add product");
    }
  };

  return (
    <form onSubmit={onSubmitHandler}>
      <div>
        <p className="mb-2">Upload Images</p>

        <div className="flex gap-2">
          <label htmlFor="image1">
            <img
              className="w-20"
              src={!image1 ? assets.upload_area : URL.createObjectURL(image1)}
              alt=""
            />
            <input
              onChange={(e) => setImage1(e.target.files[0])}
              type="file"
              id="image1"
              hidden
            />
          </label>
          <label htmlFor="image2">
            <img
              className="w-20"
              src={!image2 ? assets.upload_area : URL.createObjectURL(image2)}
              alt=""
            />
            <input
              onChange={(e) => setImage2(e.target.files[0])}
              type="file"
              id="image2"
              hidden
            />
          </label>
          <label htmlFor="image3">
            <img
              className="w-20"
              src={!image3 ? assets.upload_area : URL.createObjectURL(image3)}
              alt=""
            />
            <input
              onChange={(e) => setImage3(e.target.files[0])}
              type="file"
              id="image3"
              hidden
            />
          </label>
          <label htmlFor="image4">
            <img
              className="w-20"
              src={!image4 ? assets.upload_area : URL.createObjectURL(image4)}
              alt=""
            />
            <input
              onChange={(e) => setImage4(e.target.files[0])}
              type="file"
              id="image4"
              hidden
            />
          </label>
        </div>
      </div>

      <div className="w-full">
        <p className="mb-2">Product Name</p>
        <input
          onChange={(e) => setItemName(e.target.value)}
          value={itemName}
          className="w-full max-w-[500px] px-3 py-2"
          type="text"
          placeholder="Type here"
          required
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:gap-8">
        <div>
          <p className="mb-2">Product Code (Pcode)</p>
          <input
            onChange={(e) => setPcode(e.target.value)}
            value={pcode}
            className="w-full px-3 py-2"
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
            className="w-full px-3 py-2"
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
            className="w-full px-3 py-2"
            type="text"
            placeholder="1kg/10pkt"
            required
          />
        </div>
      </div>

      <div className="mt-4 max-w-[800px]">
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

      <button className="w-28 py-3 mt-4 bg-black text-white" type="submit">
        ADD
      </button>
    </form>
  );
};

Add.propTypes = {
  token: PropTypes.string.isRequired,
};

export default Add;
