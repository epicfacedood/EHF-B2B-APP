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
    setOrderInfo({
      ...orderInfo,
      [e.target.name]: e.target.value,
    });
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
          {/* Customer Information Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                required
                name="customerName"
                value={orderInfo.customerName}
                onChange={handleInputChange}
                className="border border-gray-300 rounded py-2 px-4 w-full"
                type="text"
                placeholder="Full Name"
              />
              <input
                required
                name="email"
                value={orderInfo.email}
                onChange={handleInputChange}
                className="border border-gray-300 rounded py-2 px-4 w-full"
                type="email"
                placeholder="Email Address"
              />
              <input
                required
                name="phone"
                value={orderInfo.phone}
                onChange={handleInputChange}
                className="border border-gray-300 rounded py-2 px-4 w-full"
                type="tel"
                placeholder="Phone Number"
              />
              <input
                name="company"
                value={orderInfo.company}
                onChange={handleInputChange}
                className="border border-gray-300 rounded py-2 px-4 w-full"
                type="text"
                placeholder="Company Name (Optional)"
              />
              <input
                required
                name="address"
                value={orderInfo.address}
                onChange={handleInputChange}
                className="border border-gray-300 rounded py-2 px-4 w-full md:col-span-2"
                type="text"
                placeholder="Delivery Address"
              />
              <input
                required
                name="postalCode"
                value={orderInfo.postalCode}
                onChange={handleInputChange}
                className="border border-gray-300 rounded py-2 px-4 w-full"
                type="text"
                placeholder="Postal Code"
              />
            </div>
            <textarea
              name="remarks"
              value={orderInfo.remarks}
              onChange={handleInputChange}
              className="border border-gray-300 rounded py-2 px-4 w-full"
              placeholder="Remarks (Optional)"
              rows="3"
            />
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
