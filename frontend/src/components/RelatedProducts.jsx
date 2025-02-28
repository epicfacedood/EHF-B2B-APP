import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";
import axios from "axios";
import { toast } from "react-toastify";

const RelatedProducts = () => {
  const { token, userCustomerId } = useContext(ShopContext);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      setIsLoading(true);
      if (!token || !userCustomerId) {
        setIsLoading(false);
        return;
      }

      try {
        // Build query parameters - just get 5 products from the customer's price list
        const params = new URLSearchParams();
        params.append("limit", 5);
        params.append("customerId", userCustomerId);

        const response = await axios.get(
          `${backendUrl}/api/product/filtered?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setRelatedProducts(response.data.products);
        }
      } catch (error) {
        console.error("Error fetching related products:", error);
        toast.error("Failed to load related products");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [token, userCustomerId, backendUrl]);

  // Don't show if no related products or still loading
  if (isLoading || relatedProducts.length === 0) return null;

  return (
    <div className="my-24">
      <div className="text-center text-3xl py-2">
        <Title text1={`MORE`} text2={"PRODUCTS"} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
        {relatedProducts.map((item, index) => (
          <ProductItem
            key={index}
            id={item._id}
            name={item.itemName}
            price={item.price}
            pcode={item.pcode}
            uoms={item.uoms}
            cartonQuantity={item.cartonQuantity}
            packagingSize={item.packagingSize}
            image={item.image}
          />
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
