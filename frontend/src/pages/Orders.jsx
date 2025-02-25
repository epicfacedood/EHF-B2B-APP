import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import axios from "axios";

const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);

  const formatPrice = (price) => {
    return Number(price).toFixed(2);
  };

  const formatDeliveryDate = (dateString) => {
    console.log("Formatting delivery date:", dateString);
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const loadOrderData = async () => {
    try {
      if (!token) return;

      console.log("Fetching orders...");
      const response = await axios.post(
        `${backendUrl}/api/order/userorders`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Orders response:", response.data);

      if (response.data.success) {
        // Group orders by orderId
        const groupedOrders = response.data.orders.reduce((acc, order) => {
          if (!acc[order.orderId]) {
            // Initialize the order group with the first order's data
            acc[order.orderId] = {
              orderId: order.orderId,
              date: order.date,
              time: order.time,
              deliveryDate: order.deliveryDate,
              status: order.status,
              customerName: order.customerName,
              address: order.address,
              postalCode: order.postalCode,
              phone: order.phone,
              email: order.email,
              remarks: order.remarks,
              subtotalPrice: order.subtotalPrice,
              totalPrice: order.totalPrice,
              paymentMethod: order.paymentMethod,
              items: [], // Initialize empty items array
            };
          }

          // Add this item to the order's items array
          acc[order.orderId].items.push({
            productName: order.productName,
            pcode: order.pcode,
            uom: order.uom,
            quantity: order.quantity,
            unitPrice: order.unitPrice,
            orderPrice: order.orderPrice,
          });

          return acc;
        }, {});

        // Convert to array and sort by date
        const sortedOrders = Object.values(groupedOrders).sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        console.log("Sorted and grouped orders:", sortedOrders);
        setOrders(sortedOrders);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  useEffect(() => {
    loadOrderData();
  }, [token, backendUrl]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const flattenedOrders = orders.flatMap((order) => {
    return order.items.map((item) => ({
      // ... other fields ...
      "Delivery Date": formatDeliveryDate(order.deliveryDate),
      // ... rest of the fields ...
    }));
  });

  return (
    <div className="border-t pt-16">
      <div className="text-2xl mb-8">
        <Title text1={"MY"} text2={"ORDERS"} />
      </div>
      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.orderId}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-lg font-semibold">Order #{order.orderId}</p>
                <p className="text-sm text-gray-600">
                  {formatDate(order.date)}
                </p>
                <p className="text-sm text-gray-600">
                  Delivery Date:{" "}
                  <span className="text-gray-800">
                    {formatDeliveryDate(order.deliveryDate)}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {order.status}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium mb-3">Order Items</h3>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="border-b pb-4 last:border-b-0"
                      >
                        <h4 className="font-medium">{item.productName}</h4>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p>Product Code: {item.pcode}</p>
                          <p>Size: {item.uom}</p>
                          <p>Quantity: {item.quantity}</p>
                          <p>
                            Unit Price: {currency}
                            {formatPrice(item.unitPrice)}
                          </p>
                          <p>
                            Item Total: {currency}
                            {formatPrice(item.orderPrice)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:w-1/3">
                  <h4 className="font-medium mb-2">Delivery Details</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      Customer Name:{" "}
                      <span className="text-gray-800">
                        {order.customerName}
                      </span>
                    </p>
                    <p>
                      Address:{" "}
                      <span className="text-gray-800">{order.address}</span>
                    </p>
                    <p>
                      Postal Code:{" "}
                      <span className="text-gray-800">{order.postalCode}</span>
                    </p>
                    <p>
                      Phone:{" "}
                      <span className="text-gray-800">{order.phone}</span>
                    </p>
                    {order.remarks && (
                      <p className="mt-2 italic">Note: {order.remarks}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Subtotal:</span>
                <span>
                  {currency}
                  {formatPrice(order.subtotalPrice)}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="font-medium">GST (9%):</span>
                <span>
                  {currency}
                  {formatPrice(order.totalPrice - order.subtotalPrice)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-semibold mt-2">
                <span>Total:</span>
                <span>
                  {currency}
                  {formatPrice(order.totalPrice)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-8 text-gray-500">No orders found</div>
        )}
      </div>
    </div>
  );
};

export default Orders;
