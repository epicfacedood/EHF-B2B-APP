import React, { useContext, useEffect, useState } from "react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import axios from "axios";

const PlaceOrder = () => {
  const [method, setMethod] = useState("cod");
  const {
    navigate,
    backendUrl,
    token,
    cartItems,
    setCartItems,
    getCartAmount,
    delivery_fee,
    products,
  } = useContext(ShopContext);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    postalCode: "",
    phoneNumber: "",
  });

  const [loading, setLoading] = useState(false);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;

    setFormData((data) => ({ ...data, [name]: value }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      let orderItems = [];
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            const itemInfo = structuredClone(
              products.find((product) => product._id === items)
            );
            if (itemInfo) {
              itemInfo.size = item;
              itemInfo.quantity = cartItems[items][item];
              orderItems.push(itemInfo);
            }
          }
        }
      }

      let orderData = {
        address: formData,
        items: orderItems,
        amount: total,
      };

      console.log("Order Data:", orderData); // Log orderData to check its state
      console.log("Method:", method); // Log method to check its state

      switch (method) {
        case "cod":
          try {
            const response = await axios.post(
              backendUrl + "/api/order/place",
              orderData,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
              setCartItems({});
              navigate("/orders");
            } else {
              toast.error(response.data.message);
            }
          } catch (error) {
            console.error("error placing order");
            toast.error("failed to place order");
          }
          break;

        case "stripe":
          try {
            const responseStripe = await axios.post(
              backendUrl + "/api/order/stripe",
              orderData,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Stripe response:", responseStripe); // Log the full response

            if (responseStripe.data.success) {
              const { session_url } = responseStripe.data;
              console.log("Redirecting to:", session_url); // Log the session URL
              window.location.replace(session_url);
            } else {
              console.error("Stripe error:", responseStripe.data); // Log the error response
              toast.error(responseStripe.data.message);
            }
          } catch (error) {
            console.error("error with stripe payment", error);
            toast.error("failed to initiate stripe payment");
          }
          break;

        default:
          break;
      }
    } catch (error) {
      console.error("error in onSubmitHandler", error);
    }
  };

  // Format price to 2 decimal places
  const formatPrice = (price) => {
    return Number(price).toFixed(2);
  };

  // Calculate cart totals
  const calculateTotals = () => {
    let subtotal = 0;
    const itemsWithDetails = [];

    // Calculate subtotal and gather item details
    Object.entries(cartItems).forEach(([itemId, sizes]) => {
      const product = products.find((p) => p._id === itemId);
      if (product) {
        Object.entries(sizes).forEach(([size, quantity]) => {
          const itemTotal = product.price * quantity;
          subtotal += itemTotal;
          itemsWithDetails.push({
            name: product.itemName,
            size,
            quantity,
            price: product.price,
            total: itemTotal,
          });
        });
      }
    });

    // Calculate GST (9%)
    const gst = subtotal * 0.09;

    return {
      items: itemsWithDetails,
      subtotal,
      gst,
      total: subtotal + gst,
    };
  };

  const { items, subtotal, gst, total } = calculateTotals();

  // Place order handler
  const handlePlaceOrder = async () => {
    if (!token) {
      toast.error("Please login to place an order");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/create`,
        {
          items: cartItems,
          amount: total,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Order placed successfully!");
        navigate("/orders");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Place order error:", error);
      toast.error("Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t"
    >
      {/* ------- left side ------- */}
      <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
        <div className="text-xl sm:text-2xl my-3">
          <Title text1={"DELIVERY"} text2={"INFORMATION"} />
        </div>
        <div className="flex gap-3">
          <input
            required
            onChange={onChangeHandler}
            name="firstName"
            value={formData.firstName}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="First Name"
          />
          <input
            required
            onChange={onChangeHandler}
            name="lastName"
            value={formData.lastName}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="Last Name"
          />
        </div>
        <input
          required
          onChange={onChangeHandler}
          name="email"
          value={formData.email}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="email"
          placeholder="Email Address"
        />
        <input
          required
          onChange={onChangeHandler}
          name="street"
          value={formData.street}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="text"
          placeholder="Street Name"
        />
        <div className="flex gap-3">
          <input
            required
            onChange={onChangeHandler}
            name="city"
            value={formData.city}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="City"
          />
          <input
            required
            onChange={onChangeHandler}
            name="postalCode"
            value={formData.postalCode}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="number"
            placeholder="Postal Code"
          />
        </div>
        <input
          required
          onChange={onChangeHandler}
          name="phoneNumber"
          value={formData.phoneNumber}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="number"
          placeholder="Phone Number"
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full sm:max-w-[480px]">
        <div className="text-xl sm:text-2xl my-3">
          <Title text1={"ORDER"} text2={"SUMMARY"} />
        </div>

        {/* Cart Items List */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="divide-y divide-gray-200">
            {items.map((item, index) => (
              <div
                key={index}
                className="py-4 flex justify-between items-start"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-600">Size: {item.size}</p>
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    ${formatPrice(item.price)} × {item.quantity}
                  </p>
                  <p className="font-medium">${formatPrice(item.total)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Total */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>GST (9%)</span>
              <span>${formatPrice(gst)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h3 className="font-medium mb-3">Payment Method</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="cod"
                checked={method === "cod"}
                onChange={(e) => setMethod(e.target.value)}
                className="form-radio"
              />
              <span>Cash on Delivery</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="stripe"
                checked={method === "stripe"}
                onChange={(e) => setMethod(e.target.value)}
                className="form-radio"
              />
              <span>Pay with Card</span>
            </label>
          </div>
        </div>

        {/* Place Order Button */}
        <button
          type="submit"
          disabled={loading || items.length === 0}
          className="w-full bg-black text-white py-3 rounded font-medium 
                     hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : "Place Order"}
        </button>
      </div>
    </form>
  );
};

export default PlaceOrder;
