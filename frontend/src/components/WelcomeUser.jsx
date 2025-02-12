import React from "react";
import { useContext } from "react";
import { ShopContext } from "../context/ShopContext";

const WelcomeUser = () => {
  const { name } = useContext(ShopContext);
  return (
    <div>
      <h1 className="mb-2 text-gray-500">Welcome, {name}!</h1>
    </div>
  );
};

export default WelcomeUser;
