import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import PropTypes from "prop-types";

const Orders = ({ token }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [orders, setOrders] = useState([]);

  const fetchAllOrders = async () => {
    if (!token) return null;

    try {
      const response = await axios.post(
        `${backendUrl}/api/order/list`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Group orders by orderId
        const groupedOrders = response.data.orders.reduce((acc, order) => {
          if (!acc[order.orderId]) {
            acc[order.orderId] = {
              orderId: order.orderId,
              date: order.date,
              time: order.time,
              status: order.status,
              customerName: order.customerName,
              email: order.email,
              phone: order.phone,
              company: order.company,
              address: order.address,
              postalCode: order.postalCode,
              remarks: order.remarks,
              subtotalPrice: order.subtotalPrice,
              totalPrice: order.totalPrice,
              paymentMethod: order.paymentMethod,
              payment: order.payment,
              items: [],
            };
          }
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
        setOrders(sortedOrders);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/status`,
        { orderId, status: event.target.value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        await fetchAllOrders();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const formatPrice = (price) => {
    return Number(price).toFixed(2);
  };

  const buttonHandler = () => {
    if (orders.length === 0) {
      toast.error("No orders to export");
      return;
    }

    // Prepare data for Excel export
    const flattenedOrders = orders.map((order) => {
      // Combine all items into a single string
      const itemsList = order.items
        .map(
          (item) =>
            `${item.productName} (${item.pcode}) - ${item.quantity} x ${item.uom} @ $${item.unitPrice}`
        )
        .join("\n");

      // Calculate total quantity
      const totalQuantity = order.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      return {
        "Order ID": order.orderId,
        Date: new Date(order.date).toLocaleDateString(),
        Time: order.time,
        Status: order.status,
        "Customer Name": order.customerName,
        Email: order.email,
        Phone: order.phone,
        Company: order.company || "-",
        "Delivery Address": order.address,
        "Postal Code": order.postalCode,
        Items: itemsList,
        "Total Items": totalQuantity,
        "Subtotal ($)": Number(order.subtotalPrice).toFixed(2),
        "GST ($)": Number(order.totalPrice - order.subtotalPrice).toFixed(2),
        "Total Amount ($)": Number(order.totalPrice).toFixed(2),
        "Payment Method": order.paymentMethod,
        Remarks: order.remarks || "-",
      };
    });

    // Set column widths
    const wscols = [
      { wch: 20 }, // Order ID
      { wch: 12 }, // Date
      { wch: 10 }, // Time
      { wch: 15 }, // Status
      { wch: 20 }, // Customer Name
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 15 }, // Company
      { wch: 35 }, // Delivery Address
      { wch: 12 }, // Postal Code
      { wch: 50 }, // Items
      { wch: 12 }, // Total Items
      { wch: 12 }, // Subtotal
      { wch: 10 }, // GST
      { wch: 15 }, // Total Amount
      { wch: 15 }, // Payment Method
      { wch: 30 }, // Remarks
    ];

    const worksheet = XLSX.utils.json_to_sheet(flattenedOrders);

    // Apply column widths
    worksheet["!cols"] = wscols;

    // Set row height for better readability
    const wsrows = Array(flattenedOrders.length + 1).fill({ hpt: 25 }); // +1 for header
    worksheet["!rows"] = wsrows;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

    // Add some styling
    ["A1:Q1"].forEach((range) => {
      const range_address = XLSX.utils.decode_range(range);
      for (let C = range_address.s.c; C <= range_address.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + "1";
        if (!worksheet[address]) continue;
        worksheet[address].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "EEEEEE" } },
        };
      }
    });

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    const fileName = `Orders_${new Date()
      .toLocaleDateString()
      .replace(/\//g, "-")}.xlsx`;
    saveAs(data, fileName);

    toast.success("Excel file downloaded");
  };

  useEffect(() => {
    fetchAllOrders();
  }, [token]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold">Order Management</h3>
        <button
          onClick={buttonHandler}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
        >
          Download as Excel
        </button>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.orderId}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-lg font-semibold">Order #{order.orderId}</p>
                <p className="text-sm text-gray-600">
                  {new Date(order.date).toLocaleString()}
                </p>
              </div>
              <select
                onChange={(event) => statusHandler(event, order.orderId)}
                value={order.status}
                className="px-3 py-1 border rounded-full text-sm font-medium bg-white"
              >
                <option value="Order Placed">Order Placed</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Order Items</h4>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="border-b pb-4 last:border-b-0"
                      >
                        <p className="font-medium">{item.productName}</p>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p>Product Code: {item.pcode}</p>
                          <p>Size: {item.uom}</p>
                          <p>Quantity: {item.quantity}</p>
                          <p>Unit Price: ${formatPrice(item.unitPrice)}</p>
                          <p>Item Total: ${formatPrice(item.orderPrice)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Customer Details</h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>
                      <span className="font-medium">Name:</span>{" "}
                      {order.customerName}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span> {order.email}
                    </p>
                    <p>
                      <span className="font-medium">Phone:</span> {order.phone}
                    </p>
                    {order.company && (
                      <p>
                        <span className="font-medium">Company:</span>{" "}
                        {order.company}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Address:</span>{" "}
                      {order.address}
                    </p>
                    <p>
                      <span className="font-medium">Postal Code:</span>{" "}
                      {order.postalCode}
                    </p>
                    {order.remarks && (
                      <p>
                        <span className="font-medium">Remarks:</span>{" "}
                        {order.remarks}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-3">Order Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${formatPrice(order.subtotalPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST (9%):</span>
                        <span>
                          ${formatPrice(order.totalPrice - order.subtotalPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between font-medium text-base pt-2 border-t">
                        <span>Total:</span>
                        <span>${formatPrice(order.totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

Orders.propTypes = {
  token: PropTypes.string.isRequired,
};

export default Orders;
