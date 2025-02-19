import React, { useContext, useEffect } from "react";
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
import AdminUsers from "./pages/AdminUsers";
import { ShopContext } from "./context/ShopContext";
import axios from "axios";

const App = () => {
  const { token, setCartItems, setProductsAvailable } = useContext(ShopContext);
  const location = useLocation();

  // Combined data fetching into a single effect
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!token) return;

      try {
        // Fetch both cart and products data concurrently
        const [cartResponse, productsResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/cart/get`),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/product/list`),
        ]);

        // Update states only if responses are successful
        if (cartResponse.data.success) {
          setCartItems(cartResponse.data.cartData || {});
        }

        if (productsResponse.data.success) {
          setProductsAvailable(productsResponse.data.products || []);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, [token]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
      <ToastContainer />
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
