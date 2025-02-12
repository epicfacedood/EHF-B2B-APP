import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";

const ProductItem = ({
  id,
  image,
  name,
  price,
  pcode,
  cartonQuantity,
  unitPrice,
  uom,
}) => {
  const { currency } = useContext(ShopContext);
  return (
    <div className="text-gray-700 border rounded-sm bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="py-4 rounded-md overflow-hidden">
        <Link to={`/product/${id}`}>
          <img
            className="hover:scale-110 transition-transform duration-300 ease-in-out w-48 h-48 object-cover mx-auto"
            src={image[0]}
            alt={name}
          />
        </Link>
        <div className="mt-4 text-center">
          <p className="text-lg font-bold">{pcode}</p>
          <p className="text-lg font-semibold">{name}</p>
          <p className="text-md font-medium">
            {currency}
            {price}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Carton Quantity: {cartonQuantity}
          </p>
          <p className="text-xs text-gray-500">
            Unit Price: {currency}
            {unitPrice}
          </p>
          <p className="text-xs text-gray-500">Unit of Measure: {uom}</p>
        </div>
      </div>
    </div>
  );
};

export default ProductItem;
