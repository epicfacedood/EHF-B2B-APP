import React, { useContext, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";

const WelcomeUser = () => {
  const { name, userCustomerId, getUserCustomerId } = useContext(ShopContext);

  useEffect(() => {
    // Try to fetch customer ID if not already available
    if (!userCustomerId) {
      getUserCustomerId();
    }
  }, [userCustomerId, getUserCustomerId]);

  return (
    <div className="bg-gray-100 p-4 rounded-lg mb-4">
      <h2 className="text-lg font-semibold">Welcome, {name || "Guest"}</h2>
      <p className="text-sm text-gray-600">
        {userCustomerId
          ? `Your Customer ID: ${userCustomerId}`
          : "Customer ID not available"}
      </p>
      {!userCustomerId && (
        <button
          onClick={getUserCustomerId}
          className="text-sm text-blue-600 underline mt-1"
        >
          Refresh Customer ID
        </button>
      )}
    </div>
  );
};

export default WelcomeUser;
