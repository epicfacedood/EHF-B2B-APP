import React, { useContext, useEffect, useCallback } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Verify from "./pages/Verify";
import PlaceOrder from "./pages/PlaceOrder";
import Orders from "./pages/Orders";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminUsers from "./pages/AdminUsers";
import { ShopContext } from "./context/ShopContext";
import axios from "axios";

const App = () => {
  const { token, setCartItems, setProductsAvailable } = useContext(ShopContext);
  const location = useLocation();

  // Memoize the fetchInitialData function
  const fetchInitialData = useCallback(async () => {
    if (!token) return;

    try {
      const [cartResponse, productsResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/cart/get`),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/product/list`),
      ]);

      // Only update state if the data has changed
      if (cartResponse.data.success) {
        setCartItems((prev) => {
          const newCart = cartResponse.data.cartData || {};
          return JSON.stringify(prev) !== JSON.stringify(newCart)
            ? newCart
            : prev;
        });
      }

      if (productsResponse.data.success) {
        setProductsAvailable((prev) => {
          const newProducts = productsResponse.data.products || [];
          return JSON.stringify(prev) !== JSON.stringify(newProducts)
            ? newProducts
            : prev;
        });
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  }, [token, setCartItems, setProductsAvailable]);

  // Set up axios interceptor for auth token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchInitialData();
    } else {
      delete axios.defaults.headers.common["Authorization"];
      // Clear data when token is removed
      setCartItems({});
      setProductsAvailable([]);
    }
  }, [token, fetchInitialData]);

  // Scroll to top on route change only
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
      <ToastContainer
        position="top-left"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      {token && <Navbar />}
      <SearchBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/product/:productId" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/place-order" element={<PlaceOrder />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/admin/users" element={<AdminUsers />} />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
