import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

const EditUser = ({ token }) => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;
  const [priceListItems, setPriceListItems] = useState([]);
  const [loadingPriceList, setLoadingPriceList] = useState(false);
  const PRICE_LIST_API_KEY =
    import.meta.env.VITE_PRICE_LIST_API_KEY || "price-list-api-key-123";

  useEffect(() => {
    if (!userId) {
      toast.error("No user ID provided");
      navigate("/users");
      return;
    }
    fetchUser();
    fetchProducts();

    return () => {
      setPriceListItems([]);
    };
  }, [userId, token, navigate]);

  useEffect(() => {
    if (user?.customerId && products.length > 0) {
      fetchPriceList(user.customerId);
    }
  }, [user?.customerId, products]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/user/admin/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setUser(response.data.user);
      } else {
        toast.error("Failed to load user data");
      }
    } catch (error) {
      console.error("Error details:", error.response || error);
      toast.error("Failed to load user");
      navigate("/users");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/product/admin/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    }
  };

  const enhancePriceListWithProductDetails = (priceListItems, products) => {
    console.log("Enhancing price list items:");
    console.log("First price list item sample:", priceListItems[0]);
    console.log("First product sample:", products[0]);

    const productMap = {};
    products.forEach((product) => {
      if (product.pcode) {
        productMap[product.pcode] = product;
      }
    });

    return priceListItems.map((item) => {
      if (!item.pcode) return item;

      const matchingProduct = productMap[item.pcode];

      if (!matchingProduct) {
        return item;
      }

      return {
        ...item,
        itemName: matchingProduct.itemName || item.itemName || item.pcode,
        description: matchingProduct.description || "",
        category: matchingProduct.category || "",
        imageUrl:
          matchingProduct.image && matchingProduct.image.length > 0
            ? matchingProduct.image[0] // Use the first image from the array
            : "",
      };
    });
  };

  const fetchPriceList = async (customerId) => {
    if (!customerId) return;

    setLoadingPriceList(true);
    try {
      console.log(`Using API Key: ${PRICE_LIST_API_KEY}`);
      console.log(`Using API Key auth route for customer ID: ${customerId}`);
      const response = await axios.get(
        `${backendUrl}/api/pricelist/apikey/customer/${customerId}`,
        {
          headers: {
            "X-API-Key": PRICE_LIST_API_KEY,
          },
        }
      );

      if (response.data.success) {
        console.log("Price list fetch successful:", response.data);

        const items = response.data.priceList?.items || [];
        const formattedItems = items.map((item) => ({
          pcode: item.pcode,
          itemName: item.itemName || item.pcode,
          price: item.price || item.unitPrice || 0,
        }));

        if (products.length > 0) {
          const enhancedItems = enhancePriceListWithProductDetails(
            formattedItems,
            products
          );
          setPriceListItems(enhancedItems);
        } else {
          setPriceListItems(formattedItems);
        }
      } else {
        setPriceListItems([]);
        console.log("No price list found for this customer ID");
      }
    } catch (error) {
      console.error("Error fetching price list:", error);
      setPriceListItems([]);
    } finally {
      setLoadingPriceList(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.pcode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `${backendUrl}/api/user/admin/${userId}`,
        user,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success("User updated successfully");
        navigate("/users");
      }
    } catch (error) {
      toast.error("Failed to update user");
      console.error(error);
    }
  };

  const handleSelectAll = () => {
    const allProductIds = products.map((product) => product._id);
    setUser({ ...user, productsAvailable: allProductIds });
  };

  const handleDeselectAll = () => {
    setUser({ ...user, productsAvailable: [] });
  };

  const handleAddressChange = (field, value) => {
    setUser({
      ...user,
      address: {
        ...user.address,
        [field]: value,
      },
    });
  };

  const navigateToAddToPriceList = (product) => {
    if (!user.customerId) {
      toast.error("Please set a Customer ID first");
      return;
    }

    // Check if product is already in the price list
    const existingItem = priceListItems.find(
      (item) => item.pcode === product.pcode
    );

    if (existingItem) {
      toast.info(`${product.itemName} is already in the price list`);
      return;
    }

    // Navigate to the add to price list page with product and customer info
    navigate(`/add-to-price-list/${user.customerId}/${product._id}`);
  };

  const handleRemoveFromPriceList = async (pcode) => {
    if (!user.customerId) {
      toast.error("Customer ID is required");
      return;
    }

    try {
      const response = await axios.delete(
        `${backendUrl}/api/pricelist/apikey/customer/${user.customerId}/item/${pcode}`,
        {
          headers: {
            "X-API-Key": PRICE_LIST_API_KEY,
          },
        }
      );

      if (response.data.success) {
        toast.success("Item removed from price list");
        // Update the local state to remove the item
        setPriceListItems(
          priceListItems.filter((item) => item.pcode !== pcode)
        );
      } else {
        toast.error(response.data.message || "Failed to remove item");
      }
    } catch (error) {
      console.error("Error removing item from price list:", error);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Edit User: {user.name}</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Customer ID
            </label>
            <input
              type="text"
              value={user.customerId || ""}
              onChange={(e) => setUser({ ...user, customerId: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              value={user.phone || ""}
              onChange={(e) => setUser({ ...user, phone: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Company
            </label>
            <input
              type="text"
              value={user.company || ""}
              onChange={(e) => setUser({ ...user, company: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Street Address
            </label>
            <input
              type="text"
              value={user.address?.street || ""}
              onChange={(e) => handleAddressChange("street", e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Postal Code
            </label>
            <input
              type="text"
              value={user.address?.postalCode || ""}
              onChange={(e) =>
                handleAddressChange("postalCode", e.target.value)
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price List Items (Customer ID: {user.customerId || "Not Set"})
          </label>
          <div className="bg-gray-50 p-4 rounded-md">
            {loadingPriceList ? (
              <p className="text-gray-500 text-sm">Loading price list...</p>
            ) : priceListItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {priceListItems.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white p-4 rounded shadow-sm border border-gray-200 relative"
                  >
                    <button
                      onClick={() => handleRemoveFromPriceList(item.pcode)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                      title="Remove from price list"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <div className="flex items-start">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.itemName}
                          className="w-16 h-16 object-cover rounded mr-3"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://via.placeholder.com/64?text=No+Image";
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded mr-3 flex items-center justify-center text-gray-400">
                          <span className="text-xs">No image</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {item.itemName}
                        </div>
                        <div className="text-sm text-gray-500 mb-1">
                          Code: {item.pcode}
                        </div>
                        {item.description && (
                          <div className="text-sm text-gray-600 mb-1 line-clamp-2">
                            {item.description}
                          </div>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-sm font-semibold text-blue-600">
                            ${item.price.toFixed(2)}
                          </div>
                        </div>
                        {item.category && (
                          <div className="text-xs text-gray-500 mt-1">
                            Category: {item.category}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : user.customerId ? (
              <p className="text-gray-500 text-sm">
                No price list items found for this customer
              </p>
            ) : (
              <p className="text-gray-500 text-sm">
                Set a Customer ID to view price list items
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate("/users")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </form>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Available Products
          </h3>
          {user.customerId ? (
            <div className="text-sm text-gray-600">
              Adding products to price list for customer: {user.customerId}
            </div>
          ) : (
            <div className="text-sm text-red-600">
              Set a Customer ID to enable adding products to price list
            </div>
          )}
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search products by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentProducts.map((product) => (
                <tr key={product._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.pcode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.itemName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${product.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      type="button"
                      onClick={() => navigateToAddToPriceList(product)}
                      disabled={
                        !user.customerId ||
                        priceListItems.some(
                          (item) => item.pcode === product.pcode
                        )
                      }
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        !user.customerId
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : priceListItems.some(
                              (item) => item.pcode === product.pcode
                            )
                          ? "bg-green-100 text-green-800 cursor-not-allowed"
                          : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                      }`}
                    >
                      {priceListItems.some(
                        (item) => item.pcode === product.pcode
                      )
                        ? "In Price List"
                        : "Add to Price List"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Showing {indexOfFirstProduct + 1} to{" "}
            {Math.min(indexOfLastProduct, filteredProducts.length)} of{" "}
            {filteredProducts.length} products
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

EditUser.propTypes = {
  token: PropTypes.string.isRequired,
};

export default EditUser;
