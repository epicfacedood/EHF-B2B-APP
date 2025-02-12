import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const currency = "$";
  const delivery_fee = 10;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [products, setProducts] = useState([]);
  const [token, setToken] = useState("");
  const [name, setName] = useState(""); // Add name state
  const navigate = useNavigate();

  const addToCart = async (itemId, size) => {
    console.log("addToCart called with itemId:", itemId, "and size:", size);

    let cartData = structuredClone(cartItems || {}); // Initialize cartData if undefined
    console.log("Initial cartData:", cartData);

    if (!size) {
      toast.error("Please select product size");
      return;
    }

    if (!cartData[itemId]) {
      cartData[itemId] = {};
    }

    if (cartData[itemId]) {
      if (cartData[itemId][size]) {
        cartData[itemId][size] += 1;
        toast.success("Product added", {
          position: "top-left",
          autoClose: 2500,
        });
      } else {
        cartData[itemId][size] = 1;
        toast.success("Product added", {
          position: "top-left",
          autoClose: 2500,
        });
      }
    } else {
      cartData[itemId] = {};
      cartData[itemId][size] = 1;
      toast.success("Product added", { position: "top-left", autoClose: 2500 });
    }
    setCartItems(cartData);

    if (token) {
      try {
        const response = await axios.post(
          backendUrl + "/api/cart/add",
          { itemId, size },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log(response.data);
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
    }
  };

  const updateQuantity = async (itemId, size, quantity) => {
    let cartData = structuredClone(cartItems);
    cartData[itemId][size] = quantity;
    setCartItems(cartData);

    if (token) {
      try {
        const response = await axios.post(
          backendUrl + "/api/cart/update",
          { itemId, size, quantity },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log(response.data);
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
    }
  };

  const getCartCount = () => {
    let totalCount = 0;
    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0) {
            totalCount += cartItems[items][item];
          }
        } catch (error) {
          alert("error with getCartCount");
        }
      }
    }
    return totalCount;
  };

  const getCartAmount = () => {
    let totalAmount = 0;
    for (const items in cartItems) {
      let itemInfo = products.find((product) => product._id === items);
      if (!itemInfo) continue; // Ensure itemInfo is defined
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0) {
            totalAmount += itemInfo.price * cartItems[items][item];
          }
        } catch (error) {}
      }
    }
    return totalAmount;
  };

  const getProductsData = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list");
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error(response.data.message);
      }
      console.log(response.data);
    } catch (error) {
      toast.error("Failed to fetch products");
      console.error(error);
    }
  };

  const getUserCart = async (token) => {
    try {
      const response = await axios.get(backendUrl + "/api/cart/get", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(response.data);
      if (response.data.success) {
        console.log(response);
        console.log("Cart Data Retrieved:", response.data.cartData); // Log the cart data
        const cartData = response.data.cartData || {}; // Handle undefined case
        setCartItems(cartData);
        localStorage.setItem("cartItems", JSON.stringify(cartData)); // Save cart items to local storage
      } else {
        console.log("Failed to retrieve the cart data");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const getUserName = async (token) => {
    try {
      const url = `${backendUrl}/api/user/name`;
      console.log("Requesting user profile from:", url);
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setName(response.data.name);
        localStorage.setItem("name", response.data.name);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log("Error fetching user profile:", error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getProductsData();
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      console.log("this use effect is working");
      setToken(storedToken);
      getUserCart(storedToken); // Sync cart with database on page refresh
      getUserName(storedToken); // Retrieve user name on page refresh
    }
  }, []);

  useEffect(() => {
    if (token) {
      getUserCart(token);
      getUserName(token); // Retrieve user name when token changes
    }
  }, [token]); // Add token as a dependency

  const value = {
    products,
    currency,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    addToCart,
    getCartCount,
    updateQuantity,
    getCartAmount,
    navigate,
    backendUrl,
    token,
    setToken,
    setCartItems,
    name, // Add name to context value
    setName,
  };

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
