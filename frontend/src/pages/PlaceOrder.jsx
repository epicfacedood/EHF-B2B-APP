import React, { useContext, useState, useEffect } from "react";
import Title from "../components/Title";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import axios from "axios";

const PlaceOrder = () => {
  const { navigate, backendUrl, token, cartItems, setCartItems, products } =
    useContext(ShopContext);

  const [loading, setLoading] = useState(false);
  const [orderInfo, setOrderInfo] = useState({
    customerName: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    postalCode: "",
    remarks: "",
    deliveryDate: "",
  });

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) return;

      try {
        const response = await axios.get(`${backendUrl}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          const userData = response.data.user;
          setOrderInfo({
            customerName: userData.name || "",
            email: userData.email || "",
            phone: userData.phone || "",
            company: userData.company || "",
            address: userData.address || "", // Street address
            postalCode: userData.postalCode || "",
            remarks: "", // Remarks always start empty
            deliveryDate: "",
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load user information");
      }
    };

    fetchUserData();
  }, [token, backendUrl]);

  // Format price to 2 decimal places
  const formatPrice = (price) => {
    return Number(price).toFixed(2);
  };

  // Calculate cart totals with GST
  const calculateTotals = () => {
    let subtotal = 0;
    const itemsWithDetails = [];

    // Calculate subtotal and gather item details
    Object.entries(cartItems).forEach(([itemId, sizes]) => {
      const product = products.find((p) => p._id === itemId);
      if (product) {
        Object.entries(sizes).forEach(([uom, quantity]) => {
          // Ensure all numbers are valid
          const unitPrice = parseFloat(product.price) || 0;
          const qty = parseInt(quantity) || 0;
          const orderPrice = unitPrice * qty;

          // Add to subtotal only if we have valid numbers
          if (!isNaN(orderPrice)) {
            subtotal += orderPrice;
          }

          itemsWithDetails.push({
            itemName: product.itemName,
            pcode: product.pcode,
            uom,
            quantity: qty,
            unitPrice: unitPrice,
            orderPrice: orderPrice,
          });
        });
      }
    });

    // Ensure we have valid numbers for all calculations
    const validSubtotal = parseFloat(subtotal) || 0;
    const gst = validSubtotal * 0.09;
    const total = validSubtotal + gst;

    return {
      items: itemsWithDetails,
      subtotalPrice: validSubtotal,
      totalPrice: total,
    };
  };

  const { items, subtotalPrice, totalPrice } = calculateTotals();

  const handleInputChange = (e) => {
    console.log("Delivery date changed:", e.target.name, e.target.value);
    setOrderInfo({
      ...orderInfo,
      [e.target.name]: e.target.value,
    });
  };

  // Function to generate available delivery dates
  const getAvailableDeliveryDates = () => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part to ensure consistent comparison

    // Start from tomorrow
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Add this helper function to format the date for the select value
  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toISOString();
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (!token) {
      toast.error("Please login to place an order");
      return;
    }

    setLoading(true);
    try {
      const { items, subtotalPrice, totalPrice } = calculateTotals();

      // Log the data we're about to send
      console.log("Order Data:", {
        items,
        subtotalPrice,
        totalPrice,
      });

      // Validate the data before sending
      const formattedItems = items.map((item) => {
        const formattedItem = {
          itemName: item.itemName,
          pcode: item.pcode,
          uom: item.uom,
          quantity: parseInt(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          orderPrice: parseFloat(item.orderPrice) || 0,
        };

        // Validate that all required numbers are valid
        if (
          isNaN(formattedItem.quantity) ||
          isNaN(formattedItem.unitPrice) ||
          isNaN(formattedItem.orderPrice)
        ) {
          throw new Error("Invalid number in order data");
        }

        return formattedItem;
      });

      const orderData = {
        items: formattedItems,
        customerInfo: {
          name: orderInfo.customerName,
          email: orderInfo.email,
          phone: orderInfo.phone,
          company: orderInfo.company,
          address: orderInfo.address,
          postalCode: orderInfo.postalCode,
          remarks: orderInfo.remarks,
          deliveryDate: orderInfo.deliveryDate,
        },
        subtotalPrice: parseFloat(subtotalPrice) || 0,
        totalPrice: parseFloat(totalPrice) || 0,
        paymentMethod: "standard",
      };

      // Validate final numbers
      if (isNaN(orderData.subtotalPrice) || isNaN(orderData.totalPrice)) {
        throw new Error("Invalid total prices");
      }

      const response = await axios.post(
        `${backendUrl}/api/order/place`,
        orderData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setCartItems({});
        navigate("/orders");
        toast.success("Order placed successfully!");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(error.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="container mx-auto max-w-3xl px-4 py-8"
    >
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b px-6 py-4">
          <div className="text-xl sm:text-2xl">
            <Title text1={"PLACE"} text2={"ORDER"} />
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={orderInfo.customerName}
                onChange={handleInputChange}
                name="customerName"
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={orderInfo.email}
                onChange={handleInputChange}
                name="email"
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={orderInfo.phone}
                onChange={handleInputChange}
                name="phone"
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Delivery Address
              </label>
              <textarea
                id="address"
                value={orderInfo.address}
                onChange={handleInputChange}
                name="address"
                className="w-full p-2 border rounded"
                rows="3"
                required
              />
            </div>

            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Order Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={orderInfo.remarks}
                onChange={handleInputChange}
                name="remarks"
                className="w-full p-2 border rounded"
                rows="3"
                placeholder="Any special instructions for your order?"
              />
            </div>
          </div>

          {/* Order Details Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Order Details</h2>
            <div className="divide-y divide-gray-200">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="py-4 flex justify-between items-start"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{item.itemName}</h3>
                    <p className="text-sm text-gray-600">
                      Product Code: {item.pcode}
                    </p>
                    <p className="text-sm text-gray-600">Size: {item.uom}</p>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      ${formatPrice(item.unitPrice)} × {item.quantity}
                    </p>
                    <p className="font-medium">
                      ${formatPrice(item.orderPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${formatPrice(subtotalPrice)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST (9%)</span>
                <span>${formatPrice(totalPrice - subtotalPrice)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>

            <div>
              <label
                htmlFor="deliveryDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Delivery Date
              </label>
              <select
                id="deliveryDate"
                name="deliveryDate"
                value={formatDateForInput(orderInfo.deliveryDate)}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select a delivery date</option>
                {getAvailableDeliveryDates().map((date) => (
                  <option key={date.toISOString()} value={date.toISOString()}>
                    {date.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer with Place Order Button */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="w-full bg-black text-white py-3 rounded font-medium 
                     hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Place Order"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
