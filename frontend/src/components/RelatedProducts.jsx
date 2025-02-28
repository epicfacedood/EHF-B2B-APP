import React, { useContext, useState, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";
import axios from "axios";
import { toast } from "react-toastify";

const RelatedProducts = () => {
  const { token, userCustomerId, backendUrl } = useContext(ShopContext);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!token || !userCustomerId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch only 5 products specific to this customer
        const response = await axios.get(
          `${backendUrl}/api/product/recommended`,
          {
            params: {
              customerId: userCustomerId,
              limit: 5,
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setRelatedProducts(response.data.products || []);
        } else {
          // Fallback to just getting any 5 products
          const fallbackResponse = await axios.get(
            `${backendUrl}/api/product/list`,
            {
              params: {
                limit: 5,
              },
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (fallbackResponse.data.success) {
            setRelatedProducts(fallbackResponse.data.products || []);
          }
        }
      } catch (error) {
        console.error("Error fetching related products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [token, userCustomerId, backendUrl]);

  // Don't show if no related products or still loading
  if (isLoading || relatedProducts.length === 0) return null;

  return (
    <div className="my-12 py-6">
      <div className="text-center text-3xl mb-6">
        <Title text1={`FOR`} text2={"YOU"} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
        {relatedProducts.map((item) => (
          <ProductItem
            key={item._id}
            id={item._id}
            name={item.itemName || item.name}
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
