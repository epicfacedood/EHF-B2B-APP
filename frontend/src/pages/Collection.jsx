import React, { useContext, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import { useState } from "react";
import { assets } from "../assets/assets";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";
import axios from "axios";
import { toast } from "react-toastify";

const Collection = () => {
  const {
    products,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    token,
    productsAvailable,
  } = useContext(ShopContext);
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [sortType, setSortType] = useState("relevant");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // Show 12 products per page
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Available categories
  const categories = [
    "BDI",
    "BPG",
    "BWI",
    "DAIRY",
    "DESSERTS",
    "DRY",
    "FRZMT",
    "FRZSF",
    "FSHMT",
    "FSHSF",
    "JPN",
    "OTHERS",
    "PM",
    "PROMT",
    "PROSF",
    "STEAKCUTS",
    "VEG",
  ];

  // Initialize filterProducts with all products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/product/list`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          console.log("Fetched products:", response.data.products); // Debug log
          setFilterProducts(response.data.products);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      }
    };

    fetchProducts();
  }, [token, productsAvailable]);

  // Add debug logging
  useEffect(() => {
    console.log("Products in Collection:", products);
  }, [products]);

  const toggleCategory = (e) => {
    if (category.includes(e.target.value)) {
      setCategory((prev) => prev.filter((item) => item !== e.target.value));
    } else {
      setCategory((prev) => [...prev, e.target.value]);
    }
  };

  const applyFilter = () => {
    let filteredProducts = products;

    // Apply search filter
    if (search) {
      filteredProducts = filteredProducts.filter(
        (item) =>
          item.itemName?.toLowerCase().includes(search.toLowerCase()) ||
          item.pcode?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply category filter
    if (category.length > 0) {
      filteredProducts = filteredProducts.filter((item) =>
        category.includes(item.category)
      );
    }

    // Apply price sorting
    if (sortType !== "relevant") {
      filteredProducts = [...filteredProducts].sort((a, b) => {
        const priceA = parseFloat(a.price);
        const priceB = parseFloat(b.price);
        return sortType === "low-high" ? priceA - priceB : priceB - priceA;
      });
    }

    setFilterProducts(filteredProducts);
  };

  // Remove separate sortProduct function and combine with applyFilter
  useEffect(() => {
    applyFilter();
  }, [search, category, sortType, products]);

  // Calculate pagination
  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = filterProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filterProducts.length / itemsPerPage);

  // Pagination controls
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t">
      {/* Search for Mobile */}
      <div className="sm:hidden w-full px-4 mb-4">
        <div className="relative">
          <input
            onChange={(e) => setSearch(e.target.value)}
            value={search}
            type="text"
            className="w-full border border-gray-400 rounded-lg px-4 py-2 pl-10"
            placeholder="Search products..."
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

      {/* Filter Options */}
      <div className="min-w-60">
        <p
          onClick={() => setShowFilter(!showFilter)}
          className="my-2 text-xl flex items-center cursor-pointer gap-2"
        >
          Filters
          <img
            src={assets.dropdown_icon}
            className={`h-3 sm:hidden ${showFilter ? "rotate-90" : ""}`}
            alt=""
          />
        </p>

        {/* Search for Desktop */}
        <div className="hidden sm:block mb-4">
          <div className="relative">
            <input
              onChange={(e) => setSearch(e.target.value)}
              value={search}
              type="text"
              className="w-full border border-gray-400 rounded-lg px-4 py-2 pl-10"
              placeholder="Search by name or code..."
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

        {/* Category filter */}
        <div
          className={`border border-gray-300 pl-5 py-3 mt-6 ${
            showFilter ? "" : "hidden"
          } sm:block`}
        >
          <p className="mb-3 text-sm font-medium">CATEGORIES</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700 max-h-[300px] overflow-y-auto">
            {categories.map((cat) => (
              <label
                key={cat}
                className="flex gap-2 items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
              >
                <input
                  className="w-3"
                  type="checkbox"
                  value={cat}
                  checked={category.includes(cat)}
                  onChange={toggleCategory}
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1">
        <div className="flex justify-between text-base sm:text-2xl mb-4">
          <Title text1={`ALL`} text2={`COLLECTIONS`} />
          {/* Product Sort */}
          <select
            onChange={(e) => {
              setSortType(e.target.value);
            }}
            className="border-2 border-gray-300 text-sm px-2 ml-auto"
          >
            <option value="relevant">Sort by Relevant</option>
            <option value="low-high">Sort by Low to High</option>
            <option value="high-low">Sort by High to Low</option>
          </select>
        </div>

        {/* Map Products */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
          {currentProducts.map((item, index) => {
            console.log("Mapping product:", item); // Debug log
            console.log("UOMs for product:", item.uoms); // Log the uoms
            return (
              <ProductItem
                key={index}
                id={item._id}
                name={item.itemName}
                price={item.price}
                pcode={item.pcode}
                uoms={item.uoms}
                cartonQuantity={item.cartonQuantity}
                packagingSize={item.packagingSize}
                image={item.image}
              />
            );
          })}
        </div>

        {/* Pagination Controls */}
        {filterProducts.length > itemsPerPage && (
          <div className="flex flex-wrap justify-center items-center gap-2 mt-8 mb-4">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-2 py-1 text-sm rounded ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-500"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              Previous
            </button>

            {/* First page */}
            {currentPage > 3 && (
              <>
                <button
                  onClick={() => paginate(1)}
                  className="px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
                >
                  1
                </button>
                {currentPage > 4 && <span className="px-1">...</span>}
              </>
            )}

            {/* Page numbers */}
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              const showPage =
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 2 &&
                  pageNumber <= currentPage + 2);

              if (!showPage) return null;

              return (
                <button
                  key={index}
                  onClick={() => paginate(pageNumber)}
                  className={`px-2 py-1 text-sm rounded ${
                    currentPage === pageNumber
                      ? "bg-black text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            {/* Last page */}
            {currentPage < totalPages - 2 && (
              <>
                {currentPage < totalPages - 3 && (
                  <span className="px-1">...</span>
                )}
                <button
                  onClick={() => paginate(totalPages)}
                  className="px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-2 py-1 text-sm rounded ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-500"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Collection;
