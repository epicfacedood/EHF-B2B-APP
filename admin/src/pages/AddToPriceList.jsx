import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

const PRICE_LIST_API_KEY =
  import.meta.env.VITE_PRICE_LIST_API_KEY || "price-list-api-key-123";

const AddToPriceList = ({ token }) => {
  const { customerId, productId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [priceListItem, setPriceListItem] = useState({
    pcode: "",
    itemName: "",
    price: 0,
    notes: "",
  });
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    if (!customerId || !productId) {
      toast.error("Missing required information");
      navigate(-1);
      return;
    }

    fetchData();
  }, [customerId, productId, token, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch product data using API key
      const productsResponse = await axios.get(
        `${backendUrl}/api/product/apikey/list`,
        {
          headers: {
            "X-API-Key": PRICE_LIST_API_KEY,
          },
        }
      );

      if (productsResponse.data.success) {
        // Find the specific product by ID
        const productData = productsResponse.data.products.find(
          (p) => p._id === productId
        );

        if (productData) {
          setProduct(productData);

          // Initialize price list item with product data
          setPriceListItem({
            pcode: productData.pcode,
            itemName: productData.itemName,
            price: productData.price,
            notes: "",
          });
        } else {
          toast.error("Product not found in the list");
          navigate(-1);
        }
      } else {
        toast.error("Failed to load products");
        navigate(-1);
      }

      // Fetch customer details using API key
      const customerResponse = await axios.get(
        `${backendUrl}/api/pricelist/apikey/customer/${customerId}`,
        {
          headers: {
            "X-API-Key": PRICE_LIST_API_KEY,
          },
        }
      );

      if (customerResponse.data.success) {
        // Extract customer info from the price list response
        const priceList = customerResponse.data.priceList;
        setCustomer({
          _id: "unknown", // We don't have this from the price list API
          name: "Customer", // We don't have this from the price list API
          customerId: priceList.customerId,
        });
      } else {
        toast.error("Failed to load customer data");
      }
    } catch (error) {
      console.error("Error details:", error.response?.data || error.message);
      console.error("Full error:", error);
      toast.error(
        `Failed to load data: ${error.response?.data?.message || error.message}`
      );
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPriceListItem({
      ...priceListItem,
      [name]: name === "price" ? parseFloat(value) || 0 : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // First, try to fix any existing price lists
      await axios.get(`${backendUrl}/api/pricelist/fix`, {
        headers: {
          "X-API-Key": PRICE_LIST_API_KEY,
        },
      });

      // Then proceed with adding the new item
      // Make sure price is a valid number
      const formattedPrice = parseFloat(priceListItem.price);
      if (isNaN(formattedPrice)) {
        toast.error("Please enter a valid price");
        return;
      }

      // Create a properly formatted item
      const formattedItem = {
        pcode: priceListItem.pcode,
        itemName: priceListItem.itemName,
        price: formattedPrice,
        notes: priceListItem.notes || "",
      };

      console.log("Sending formatted item:", formattedItem);

      const response = await axios.post(
        `${backendUrl}/api/pricelist/apikey/customer/${customerId}/item`,
        formattedItem,
        {
          headers: {
            "X-API-Key": PRICE_LIST_API_KEY,
          },
        }
      );

      console.log("Response:", response.data);

      if (response.data.success) {
        toast.success(`Added ${priceListItem.itemName} to price list`);
        navigate(-1);
      } else {
        console.error("API returned error:", response.data);
        toast.error(
          response.data.message || "Failed to add product to price list"
        );
      }
    } catch (error) {
      console.error("Error adding to price list:", error);
      console.error("Error response:", error.response?.data);
      toast.error(
        `Failed to add product to price list: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!product) return <div className="p-4">Product not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Add Product to Price List</h2>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 mb-4 md:mb-0 md:pr-4">
            {product.image && product.image.length > 0 ? (
              <img
                src={product.image[0]}
                alt={product.itemName}
                className="w-full h-auto object-cover rounded-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://via.placeholder.com/300?text=No+Image";
                }}
              />
            ) : (
              <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">No image available</span>
              </div>
            )}
          </div>

          <div className="md:w-2/3">
            <h3 className="text-xl font-semibold">{product.itemName}</h3>
            <p className="text-gray-600 mb-2">Product Code: {product.pcode}</p>

            {product.description && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700">Description</h4>
                <p className="text-gray-600">{product.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-gray-700 font-medium">Base Price:</span>
                <span className="ml-2">${product.price.toFixed(2)}</span>
              </div>

              {product.category && (
                <div>
                  <span className="text-gray-700 font-medium">Category:</span>
                  <span className="ml-2">{product.category}</span>
                </div>
              )}

              {product.baseUnit && (
                <div>
                  <span className="text-gray-700 font-medium">Unit:</span>
                  <span className="ml-2">{product.baseUnit}</span>
                </div>
              )}

              {product.packagingSize && (
                <div>
                  <span className="text-gray-700 font-medium">Packaging:</span>
                  <span className="ml-2">{product.packagingSize}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
        {customer ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-700 font-medium">Name:</span>
              <span className="ml-2">{customer.name}</span>
            </div>
            <div>
              <span className="text-gray-700 font-medium">Customer ID:</span>
              <span className="ml-2">{customer.customerId}</span>
            </div>
            {customer.email && (
              <div>
                <span className="text-gray-700 font-medium">Email:</span>
                <span className="ml-2">{customer.email}</span>
              </div>
            )}
            {customer.phone && (
              <div>
                <span className="text-gray-700 font-medium">Phone:</span>
                <span className="ml-2">{customer.phone}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600">Customer information not available</p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Price List Item Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Code
            </label>
            <input
              type="text"
              name="pcode"
              value={priceListItem.pcode}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name
            </label>
            <input
              type="text"
              name="itemName"
              value={priceListItem.itemName}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price for this Customer
            </label>
            <input
              type="number"
              name="price"
              value={priceListItem.price}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className="w-full p-2 border rounded-md"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              You can set a custom price for this customer
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              name="notes"
              value={priceListItem.notes}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Add to Price List
          </button>
        </div>
      </form>
    </div>
  );
};

AddToPriceList.propTypes = {
  token: PropTypes.string.isRequired,
};

export default AddToPriceList;
