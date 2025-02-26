import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { backendUrl } from "../components/Login";
import axios from "axios";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import { assets } from "../assets/assets";

const ITEMS_PER_PAGE = 10;

const List = ({ token }) => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchList = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/product/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setList(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [token]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredList = list.filter((item) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (item?.itemName?.toLowerCase()?.includes(searchLower) ?? false) ||
      (item?.pcode?.toLowerCase()?.includes(searchLower) ?? false)
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedList = filteredList.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handleEditProduct = (productId) => {
    navigate(`/admin/product/edit/${productId}`);
  };

  const formatUoms = (uoms) => {
    if (typeof uoms === "string") return uoms;
    if (Array.isArray(uoms)) return uoms.join(", ");
    return "N/A";
  };

  const removeProduct = async (id) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/product/remove`,
        { id },
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
      console.error("Error removing product:", error);
      toast.error(error.message);
    }
  };

  return (
    <div className="p-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <h3 className="text-2xl font-semibold">Product Management</h3>
        <div className="w-full md:w-64">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or code..."
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
      </div>

      <div className="bg-white rounded-lg shadow">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[100px_2fr_1fr_1fr_1fr_1fr_1fr_1fr] items-center py-3 px-4 bg-gray-50 border-b text-sm font-medium">
          <div>Image</div>
          <div>Name</div>
          <div>Code</div>
          <div>Price</div>
          <div>Packaging Size</div>
          <div>UOM</div>
          <div>UOMs</div>
          <div className="text-center">Actions</div>
        </div>

        {/* Product List */}
        <div className="divide-y">
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading...</div>
          ) : paginatedList.length > 0 ? (
            paginatedList.map((item) => (
              <div
                key={item._id}
                className="grid grid-cols-[100px_2fr_1fr_1fr_1fr_1fr_1fr_1fr] items-center gap-4 py-4 px-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleEditProduct(item._id)}
              >
                <div className="w-20 h-20 overflow-hidden rounded-lg border">
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
                <div className="truncate" title={item.itemName || ""}>
                  {item.itemName || "No name"}
                </div>
                <div className="truncate" title={item.pcode || ""}>
                  {item.pcode || "No code"}
                </div>
                <div>${item.price?.toFixed(2) || "0.00"}</div>
                <div className="truncate" title={item.packagingSize || ""}>
                  {item.packagingSize || "N/A"}
                </div>
                <div>{item.uom || "N/A"}</div>
                <div className="truncate" title={formatUoms(item.uoms)}>
                  {formatUoms(item.uoms)}
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeProduct(item._id);
                    }}
                    className="w-8 h-8 rounded-full hover:bg-red-50 text-red-500 flex items-center justify-center transition-colors"
                    title="Remove product"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-gray-500">
              {searchTerm ? "No products found" : "No products available"}
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredList.length > 0 && (
          <div className="flex justify-between items-center px-4 py-3 border-t">
            <div className="text-sm text-gray-500">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + ITEMS_PER_PAGE, filteredList.length)} of{" "}
              {filteredList.length} products
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPage((p) => Math.max(1, p - 1));
                }}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                }}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

List.propTypes = {
  token: PropTypes.string.isRequired,
};

export default List;
