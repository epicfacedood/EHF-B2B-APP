import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";
import PropTypes from "prop-types";

const RelatedProducts = ({ category = "", subCategory = "" }) => {
  const { products } = useContext(ShopContext);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    if (products.length > 0 && category) {
      // Get products in same category, excluding current product
      let relatedProducts = products.filter((item) => {
        const isSameCategory =
          item.category?.toLowerCase() === category.toLowerCase();
        return isSameCategory;
      });

      // Log for debugging
      console.log("Category:", category);
      console.log("Products in category:", relatedProducts.length);
      console.log(
        "Sample product categories:",
        products.slice(0, 5).map((p) => p.category)
      );

      // Limit to 5 products
      setRelated(relatedProducts.slice(0, 5));
    }
  }, [products, category]);

  // Don't show if no related products
  if (related.length === 0) return null;

  return (
    <div className="my-24">
      <div className="text-center text-3xl py-2">
        <Title text1={`RELATED`} text2={"PRODUCTS"} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
        {related.map((item, index) => (
          <ProductItem
            key={index}
            id={item._id}
            name={item.itemName}
            price={item.price}
            pcode={item.pcode}
            uoms={item.uoms}
            cartonQuantity={item.cartonQuantity}
            packagingSize={item.packagingSize}
          />
        ))}
      </div>
    </div>
  );
};

RelatedProducts.propTypes = {
  category: PropTypes.string,
  subCategory: PropTypes.string,
};

export default RelatedProducts;
