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
    if (user?.customerId) {
      fetchPriceList(user.customerId);
    } else {
      setPriceListItems([]);
    }
  }, [user?.customerId, token]);

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

        // Process the price list data
        const items = response.data.priceList?.items || [];
        const formattedItems = items.map((item) => ({
          pcode: item.pcode,
          itemName: item.itemName || item.pcode,
          price: item.price || item.unitPrice || 0,
        }));
        setPriceListItems(formattedItems);
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
                  <div key={index} className="bg-white p-3 rounded shadow-sm">
                    <div className="font-medium">{item.itemName}</div>
                    <div className="text-sm text-gray-500">{item.pcode}</div>
                    <div className="text-sm font-semibold text-blue-600">
                      ${item.price}
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
            Manage Available Products
          </h3>
          <div className="space-x-4">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50"
            >
              Deselect All
            </button>
          </div>
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
                  Available
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
                    <input
                      type="checkbox"
                      checked={user.productsAvailable?.includes(product._id)}
                      onChange={(e) => {
                        const newProducts = e.target.checked
                          ? [...(user.productsAvailable || []), product._id]
                          : (user.productsAvailable || []).filter(
                              (id) => id !== product._id
                            );
                        setUser({ ...user, productsAvailable: newProducts });
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
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
