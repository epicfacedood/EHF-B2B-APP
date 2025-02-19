import React from "react";
import { Link } from "react-router-dom";

const EmptyCart = () => {
  return (
    <div className="text-center py-8">
      <h2 className="text-2xl mb-4">Your cart is empty</h2>
      <Link to="/" className="text-blue-500 hover:text-blue-600">
        Continue Shopping
      </Link>
    </div>
  );
};

export default EmptyCart;
