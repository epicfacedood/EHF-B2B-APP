import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Use the open /all endpoint for admin
        const response = await axios.get(
          "http://localhost:4000/api/product/all"
        );

        // Make sure we have a valid response
        if (response.data && response.data.success) {
          // If it's the test response, set empty array
          if (response.data.message && response.data.timestamp) {
            setProducts([]);
          } else if (Array.isArray(response.data.products)) {
            setProducts(response.data.products);
          } else {
            setProducts([]);
          }
        } else {
          setProducts([]);
          setError("Invalid response format");
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts([]); // Set empty array on error
        setError(err.message || "Error fetching products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Safely filter products - check if products is an array first
  const filteredProducts = Array.isArray(products) ? products : [];

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!filteredProducts.length) return <div>No products found</div>;

  return (
    <div>
      <h1>Admin Products</h1>
      <div className="product-list">
        {filteredProducts.map((product) => (
          <div key={product._id} className="product-card">
            <h3>{product.itemName}</h3>
            <p>{product.description}</p>
            {/* Other product details */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminList;
