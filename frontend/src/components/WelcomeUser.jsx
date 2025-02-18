import React from "react";
import { useContext } from "react";
import { ShopContext } from "../context/ShopContext";

const WelcomeUser = () => {
  const { name } = useContext(ShopContext);
  return (
    <div>
      <h1 className="mb-2 text-gray-1000">
        Welcome, <span className="font-bold">{name}</span>!
      </h1>
    </div>
  );
};

export default WelcomeUser;
