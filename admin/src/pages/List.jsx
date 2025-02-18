import React from "react";
import { useState, useEffect } from "react";
import { backendUrl } from "../components/Login";
import axios from "axios";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import { assets } from "../assets/assets";

const List = ({ token }) => {
  const [list, setList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchList = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list");
      if (response.data.success) {
        setList(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const removeProduct = async (id) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/product/remove",
        {
          id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <>
      {/* Header section with title and search */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-lg font-medium">All Products List</p>
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-gray-500"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {/* List Table Title */}
        <div className="hidden md:grid grid-cols-[100px_2fr_1fr_1fr_1fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm">
          <b>Image</b>
          <b>Name</b>
          <b>Code</b>
          <b>Price</b>
          <b>Package</b>
          <b>UOM</b>
          <b>UOMs</b>
          <b className="text-center">Action</b>
        </div>

        {/* --- Product List --- */}
        {list
          .filter((item) => {
            if (!searchTerm) return true; // Show all items if no search term

            const searchLower = searchTerm.toLowerCase();
            return (
              item?.itemName?.toLowerCase()?.includes(searchLower) ||
              false ||
              item?.pcode?.toLowerCase()?.includes(searchLower) ||
              false
            );
          })
          .map((item, index) => (
            <div
              className="grid grid-cols-[100px_2fr_1fr_1fr_1fr_1fr_1fr_1fr] items-center gap-2 py-2 px-2 border text-sm hover:bg-gray-50"
              key={index}
            >
              <div className="w-[80px] h-[80px] overflow-hidden rounded">
                <img
                  className="w-full h-full object-cover"
                  src={item.image?.[0] || assets.upload_area}
                  alt={item.itemName || "Product"}
                  onError={(e) => {
                    e.target.src = assets.upload_area;
                    e.target.onerror = null;
                  }}
                />
              </div>
              <p className="truncate" title={item.itemName || ""}>
                {item.itemName || "No name"}
              </p>
              <p className="truncate" title={item.pcode || ""}>
                {item.pcode || "No code"}
              </p>
              <p>${item.price || 0}</p>
              <p className="truncate" title={item.packagingSize || ""}>
                {item.packagingSize || "N/A"}
              </p>
              <p>{item.uom || "N/A"}</p>
              <p className="truncate" title={item.uoms || ""}>
                {item.uoms ? item.uoms.split(",").join(", ") : "N/A"}
              </p>
              <button
                onClick={() => removeProduct(item._id)}
                className="justify-self-center w-8 h-8 rounded-full hover:bg-red-50 text-red-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
      </div>
    </>
  );
};

List.propTypes = {
  token: PropTypes.string.isRequired,
};

export default List;
