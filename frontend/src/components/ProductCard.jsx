import React from "react";

const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      <img src={product.image[0]} alt={product.name} />
      <h2>{product.name}</h2>
      <p>{product.description}</p>
      <p>${product.price}</p>
      {product.bestseller && <span>Bestseller</span>}
    </div>
  );
};

export default ProductCard;
