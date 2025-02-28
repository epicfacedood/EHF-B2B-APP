import React, { useEffect, useState, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";
import axios from "axios";

const LatestCollection = () => {
  const { products, token, userCustomerId, backendUrl } =
    useContext(ShopContext);
  const [displayProducts, setDisplayProducts] = useState([]);
  const [isLoadingPriceList, setIsLoadingPriceList] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      // Default to showing regular products if not logged in or missing customer ID
      if (!token || !userCustomerId) {
        setDisplayProducts(products.slice(0, 10));
        return;
      }

      // Otherwise, try to load from price list
      setIsLoadingPriceList(true);

      try {
        // Get the user's price list
        const priceListResponse = await axios.get(
          `${backendUrl}/api/pricelist/customer/${userCustomerId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (
          priceListResponse.data.success &&
          priceListResponse.data.priceList?.items?.length
        ) {
          // Get items from price list
          const priceListItems = priceListResponse.data.priceList.items;

          // Create a map for quick lookups
          const priceMap = {};
          priceListItems.forEach((item) => {
            priceMap[item.pcode] = Number(item.price);
          });

          // Get product codes from the price list
          const productCodes = priceListItems.map((item) => item.pcode);

          // Filter products that match the price list
          const customerProducts = products
            .filter((product) => productCodes.includes(product.pcode))
            .map((product) => ({
              ...product,
              // Override price with custom price
              price: priceMap[product.pcode] || product.price,
            }))
            .slice(0, 10); // Limit to 10 items

          if (customerProducts.length > 0) {
            setDisplayProducts(customerProducts);
            setIsLoadingPriceList(false);
            return;
          }
        }

        // Fallback to regular products if no price list or empty result
        setDisplayProducts(products.slice(0, 10));
      } catch (error) {
        console.error("Error loading price list products:", error);
        // Fallback to regular products
        setDisplayProducts(products.slice(0, 10));
      } finally {
        setIsLoadingPriceList(false);
      }
    };

    loadProducts();
  }, [products, token, userCustomerId, backendUrl]);

  // Don't show if no products
  if (displayProducts.length === 0) return null;

  return (
    <div className="my-10">
      <div className="text-center py-8 text-3xl">
        <Title
          text1={token && userCustomerId ? "YOUR" : "OUR"}
          text2={"PRODUCTS"}
        />
        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-500 font-bold">
          {token && userCustomerId
            ? "Products tailored to your price list"
            : "Discover the best products on the market today."}
        </p>
      </div>

      {isLoadingPriceList ? (
        <div className="text-center py-4">Loading your products...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
          {displayProducts.map((item) => (
            <ProductItem
              key={item._id}
              id={item._id}
              name={item.itemName || item.name}
              price={item.price}
              pcode={item.pcode}
              uoms={item.uoms || item.uomOptions}
              cartonQuantity={item.cartonQuantity}
              packagingSize={item.packagingSize}
              image={item.image}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LatestCollection;
