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
  const [price, setPrice] = useState("");
  const [baseUnit, setBaseUnit] = useState("");
  const [packagingSize, setPackagingSize] = useState("");
  const [uom, setUom] = useState("");
  const [uoms, setUoms] = useState("");
  const [selectedUoms, setSelectedUoms] = useState([]);
  const [category, setCategory] = useState("BDI");
  const [bestseller, setBestSeller] = useState(false);

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

  const handleUomSelect = (selectedUom) => {
    if (!selectedUoms.includes(selectedUom) && selectedUom) {
      const newUoms = [...selectedUoms, selectedUom];
      setSelectedUoms(newUoms);
      setUoms(newUoms.join(","));
    }
  };

  const removeUom = (uomToRemove) => {
    const newUoms = selectedUoms.filter((u) => u !== uomToRemove);
    setSelectedUoms(newUoms);
    setUoms(newUoms.join(","));
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("itemName", itemName);
      formData.append("pcode", pcode);
      formData.append("price", price);
      formData.append("baseUnit", baseUnit);
      formData.append("packagingSize", packagingSize);
      formData.append("uom", uom);
      // Convert uoms string to array format
      const uomsArray = uoms.split(",").map((item) => item.trim());
      formData.append("uoms", JSON.stringify(uomsArray));
      formData.append("category", category);
      formData.append("bestseller", bestseller);

      // Add images
      if (image1) formData.append("image1", image1);
      if (image2) formData.append("image2", image2);
      if (image3) formData.append("image3", image3);
      if (image4) formData.append("image4", image4);

      // Log the form data for debugging
      console.log("UOMs being sent:", uomsArray);
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
        setPrice("");
        setPcode("");
        setBaseUnit("");
        setPackagingSize("");
        setUom("");
        setUoms("");
        setImage1(null);
        setImage2(null);
        setImage3(null);
        setImage4(null);
        setSelectedUoms([]);
        setUoms("");
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
          <p className="mb-2">Product Category</p>
          <select
            onChange={(e) => setCategory(e.target.value)}
            value={category}
            className="w-full px-3 py-2"
          >
            <option value="BDI">BDI</option>
            <option value="BPG">BPG</option>
            <option value="BWI">BWI</option>
            <option value="DAIRY">DAIRY</option>
            <option value="DESSERTS">DESSERTS</option>
            <option value="DRY">DRY</option>
            <option value="FRZMT">FRZMT</option>
            <option value="FRZSF">FRZSF</option>
            <option value="FSHMT">FSHMT</option>
            <option value="FSHSF">FSHSF</option>
            <option value="JPN">JPN</option>
            <option value="OTHERS">OTHERS</option>
            <option value="PM">PM</option>
            <option value="PROMT">PROMT</option>
            <option value="PROSF">PROSF</option>
            <option value="STEAKCUTS">STEAKCUTS</option>
            <option value="VEG">VEG</option>
          </select>
        </div>
        <div>
          <p className="mb-2">Price</p>
          <input
            onChange={(e) => setPrice(e.target.value)}
            value={price}
            className="w-full h-[56%] px-3 py-2 sm:w-[120px]"
            type="number"
            placeholder="25"
            required
          />
        </div>
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

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:gap-8">
        <div>
          <p className="mb-2">Unit of Measure (UOM)</p>
          <input
            onChange={(e) => setUom(e.target.value)}
            value={uom}
            className="w-full px-3 py-2"
            type="text"
            placeholder="KG"
            required
          />
        </div>
        <div className="w-64">
          <p className="mb-2">UOMS</p>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <select
                onChange={(e) => handleUomSelect(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                value=""
              >
                <option value="" disabled>
                  Select UOM
                </option>
                {availableUoms.map((availableUom) => (
                  <option key={availableUom} value={availableUom}>
                    {availableUom}
                  </option>
                ))}
              </select>
            </div>

            {/* Display selected UOMs */}
            <div className="flex flex-wrap gap-2 max-w-[16rem]">
              {selectedUoms.map((selectedUom) => (
                <span
                  key={selectedUom}
                  className="px-2 py-1 bg-gray-100 rounded flex items-center gap-1"
                >
                  {selectedUom}
                  <button
                    type="button"
                    onClick={() => removeUom(selectedUom)}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <input type="hidden" name="uoms" value={uoms} required />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-2">
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
