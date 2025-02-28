import React, { useContext, useState, useEffect } from "react";
import Title from "../components/Title";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import axios from "axios";

const PlaceOrder = () => {
  const {
    navigate,
    backendUrl,
    token,
    cartItems,
    setCartItems,
    products,
    userCustomerId, // Add this to get the customer ID
    currency,
  } = useContext(ShopContext);

  // Add minimum order amount constant
  const MINIMUM_ORDER_AMOUNT = 80;

  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState({}); // Add state for storing prices
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
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

  // Add new effect to fetch prices
  useEffect(() => {
    const fetchPrices = async () => {
      if (!userCustomerId || !token) return;

      setIsLoadingPrices(true);
      try {
        const response = await axios.get(
          `${backendUrl}/api/pricelist/customer/${userCustomerId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success && response.data.priceList?.items) {
          // Transform the prices into a map for easy lookup
          const priceMap = {};
          response.data.priceList.items.forEach((item) => {
            if (item.pcode && item.price) {
              priceMap[item.pcode] = Number(item.price);
            }
          });
          setPrices(priceMap);
        }
      } catch (error) {
        console.error("Error loading prices:", error);
      } finally {
        setIsLoadingPrices(false);
      }
    };

    fetchPrices();
  }, [userCustomerId, token, backendUrl]);

  // Format price to 2 decimal places
  const formatPrice = (price) => {
    return Number(price).toFixed(2);
  };

  // Add helper function to get product price
  const getPrice = (product) => {
    if (!product) return 0;
    // First check the custom price list
    if (prices[product.pcode]) {
      return Number(prices[product.pcode]);
    }
    // Fallback to product's base price
    return Number(product.price) || 0;
  };

  // Calculate cart totals with GST - update to use the price map
  const calculateTotals = () => {
    let subtotal = 0;
    const itemsWithDetails = [];

    // Calculate subtotal and gather item details
    Object.entries(cartItems).forEach(([itemId, sizes]) => {
      const product = products.find((p) => p._id === itemId);
      if (product) {
        Object.entries(sizes).forEach(([uom, quantity]) => {
          // Get the price from our price map
          const unitPrice = getPrice(product);
          const qty = parseInt(quantity) || 0;

          // Apply UOM multiplier if applicable
          const uomOption = product.uomOptions?.find((opt) => opt.code === uom);
          const qtyPerUOM = uomOption?.qtyPerUOM || 1;

          // Calculate the actual price including UOM multiplier
          const orderPrice = unitPrice * qtyPerUOM * qty;

          // Add to subtotal only if we have valid numbers
          if (!isNaN(orderPrice)) {
            subtotal += orderPrice;
          }

          itemsWithDetails.push({
            itemName: product.itemName || product.name,
            pcode: product.pcode,
            uom,
            quantity: qty,
            unitPrice: unitPrice,
            qtyPerUOM: qtyPerUOM,
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

  // Check if order meets minimum amount
  const isOrderAmountValid = subtotalPrice >= MINIMUM_ORDER_AMOUNT;

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

  // Update onSubmitHandler to include UOM multiplier info
  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (!token) {
      toast.error("Please login to place an order");
      return;
    }

    if (!isOrderAmountValid) {
      toast.error(
        `Minimum order amount is ${currency}${MINIMUM_ORDER_AMOUNT.toFixed(2)}`
      );
      return;
    }

    setLoading(true);
    try {
      const { items, subtotalPrice, totalPrice } = calculateTotals();

      // Validate the data before sending
      const formattedItems = items.map((item) => {
        const formattedItem = {
          itemName: item.itemName,
          pcode: item.pcode,
          uom: item.uom,
          quantity: parseInt(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          qtyPerUOM: item.qtyPerUOM || 1, // Add this field
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

            {isLoadingPrices && (
              <div className="bg-yellow-50 p-2 rounded text-center text-sm">
                Loading your customized prices...
              </div>
            )}

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
                    <p className="text-sm text-gray-600">
                      Size: {item.uom}
                      {item.qtyPerUOM > 1 && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({item.qtyPerUOM} units)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {currency}
                      {formatPrice(item.unitPrice)}
                      {item.qtyPerUOM > 1 && ` × ${item.qtyPerUOM}`}
                      {` × ${item.quantity}`}
                    </p>
                    <p className="font-medium">
                      {currency}
                      {formatPrice(item.orderPrice)}
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

                {/* Add minimum order warning */}
                {!isOrderAmountValid && (
                  <div className="mt-2 text-red-600 text-sm">
                    Minimum order amount is ${MINIMUM_ORDER_AMOUNT.toFixed(2)}.
                    Please add $
                    {formatPrice(MINIMUM_ORDER_AMOUNT - subtotalPrice)} more to
                    your order.
                  </div>
                )}
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
            disabled={loading || items.length === 0 || !isOrderAmountValid}
            className="w-full bg-black text-white py-3 rounded font-medium 
                     hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading
              ? "Processing..."
              : !isOrderAmountValid
              ? `Minimum order: ${currency}${MINIMUM_ORDER_AMOUNT.toFixed(2)}`
              : "Place Order"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
