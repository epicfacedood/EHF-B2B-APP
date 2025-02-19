import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PropTypes from "prop-types";

export const ShopContext = createContext(null);

export const ShopContextProvider = ({ children }) => {
  const currency = "$";
  const delivery_fee = 10;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [products, setProducts] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [name, setName] = useState(localStorage.getItem("name") || "");
  const [productsAvailable, setProductsAvailable] = useState(
    JSON.parse(localStorage.getItem("productsAvailable")) || []
  );
  const navigate = useNavigate();

  // Initialize axios default headers when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Load cart data whenever token changes
  useEffect(() => {
    const loadCartData = async () => {
      if (token) {
        try {
          const response = await axios.get(`${backendUrl}/api/cart/get`);
          if (response.data.success) {
            setCartItems(response.data.cartData || {});
          }
        } catch (error) {
          console.error("Error loading cart:", error);
          // If unauthorized, clear token
          if (error.response?.status === 401) {
            handleLogout();
          }
        }
      } else {
        setCartItems({});
      }
    };

    loadCartData();
  }, [token, backendUrl]);

  // Add to cart
  const addToCart = async (itemId, size) => {
    if (!token) {
      toast.error("Please login to add items to cart");
      return;
    }

    if (!size) {
      toast.error("Please select a size");
      return;
    }

    try {
      // Store previous cart state for rollback
      const previousCart = { ...cartItems };

      // Create optimistic update
      const currentCart = { ...cartItems };
      if (!currentCart[itemId]) {
        currentCart[itemId] = {};
      }
      currentCart[itemId][size.uom] =
        (currentCart[itemId][size.uom] || 0) + size.quantity;

      // Update state immediately for better UX
      setCartItems(currentCart);

      const response = await axios.post(
        `${backendUrl}/api/cart/add`,
        { itemId, size },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Only update if we get valid cart data back
        if (
          response.data.cartData &&
          Object.keys(response.data.cartData).length > 0
        ) {
          setCartItems(response.data.cartData);
        } else {
          // Keep our optimistic update if server doesn't return cart data
          setCartItems(currentCart);
        }
      } else {
        // Revert to previous state if operation failed
        setCartItems(previousCart);
        toast.error(response.data.message || "Failed to add item to cart");
      }
    } catch (error) {
      // Revert to previous state on error
      setCartItems(previousCart);
      console.error(
        "Add to cart error:",
        error.response?.data || error.message
      );
      toast.error(
        error.response?.data?.message || "Failed to add item to cart"
      );
    }
  };

  // Get cart count for navbar - make it more robust
  const getCartCount = () => {
    if (!cartItems || typeof cartItems !== "object") return 0;

    let count = 0;
    Object.values(cartItems).forEach((sizes) => {
      if (sizes && typeof sizes === "object") {
        Object.values(sizes).forEach((quantity) => {
          const qty = Number(quantity);
          if (!isNaN(qty) && qty > 0) {
            count += qty;
          }
        });
      }
    });
    return count;
  };

  // Update cart quantity
  const updateQuantity = async (itemId, quantity, uom) => {
    if (!token) {
      toast.error("Please login to update cart");
      return;
    }

    try {
      // Store the previous cart state for rollback
      const previousCart = { ...cartItems };

      // Optimistic update
      const currentCart = { ...cartItems };
      if (quantity === 0) {
        // Remove the size if quantity is 0
        if (currentCart[itemId]) {
          delete currentCart[itemId][uom];
          // Remove the product if no sizes left
          if (Object.keys(currentCart[itemId]).length === 0) {
            delete currentCart[itemId];
          }
        }
      } else {
        // Update quantity
        if (!currentCart[itemId]) {
          currentCart[itemId] = {};
        }
        currentCart[itemId][uom] = quantity;
      }

      // Update local state immediately
      setCartItems(currentCart);

      const response = await axios.post(
        `${backendUrl}/api/cart/update`,
        {
          itemId,
          size: {
            uom,
            quantity,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Verify the server response has data before updating
        if (response.data.cartData) {
          setCartItems(response.data.cartData);
        } else {
          // If no cart data in response, keep the optimistic update
          setCartItems(currentCart);
        }

        if (quantity === 0) {
          toast.success("Item removed from cart");
        }
      } else {
        // If failed, revert to previous state
        setCartItems(previousCart);
        toast.error(response.data.message || "Failed to update cart");
      }
    } catch (error) {
      // If error, revert to previous state
      setCartItems(previousCart);
      console.error("Update cart error:", error);
      toast.error("Failed to update cart");
    }
  };

  const removeFromCart = async (productId) => {
    if (!token) {
      toast.error("Please login to manage cart");
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/cart/remove`,
        { itemId: productId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setCartItems(response.data.cartData);
        toast.success("Item removed from cart");
      } else {
        toast.error(response.data.message || "Failed to remove item");
      }
    } catch (error) {
      console.error("Remove from cart error:", error);
      toast.error("Failed to remove item from cart");
    }
  };

  const getUserCart = async (token) => {
    if (!token) return;

    try {
      const response = await axios.get(`${backendUrl}/api/cart/get`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        setCartItems(response.data.cartData || {});
      } else {
        setCartItems({});
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Get cart error:", error.response?.data || error.message);
      setCartItems({});
      toast.error("Failed to fetch cart");
    }
  };

  const getCartAmount = () => {
    let totalAmount = 0;
    for (const items in cartItems) {
      let itemInfo = products.find((product) => product._id === items);
      if (!itemInfo) continue;
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0) {
            totalAmount += (itemInfo.price || 0) * cartItems[items][item];
          }
        } catch (error) {
          handleError(error);
        }
      }
    }
    return totalAmount;
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

  const handleLogin = (data) => {
    if (data.success) {
      setToken(data.token);
      setName(data.name);
      setProductsAvailable(data.productsAvailable || []);
      localStorage.setItem("token", data.token);
      localStorage.setItem("name", data.name);
      localStorage.setItem(
        "productsAvailable",
        JSON.stringify(data.productsAvailable || [])
      );
    }
    return data;
  };

  const handleLogout = () => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();

    // Reset states
    setToken("");
    setName("");
    setCartItems({});

    // Remove auth header
    delete axios.defaults.headers.common["Authorization"];

    // Navigate to login
    navigate("/login");
  };

  // Add this useEffect to load products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (!token) return;

        const response = await axios.get(`${backendUrl}/api/product/list`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setProducts(response.data.products);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      }
    };

    fetchProducts();
  }, [token]);

  // Initialize app
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      getUserCart(storedToken);
      getUserName(storedToken);
    }
  }, []);

  // Update token
  const updateToken = (newToken) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
      setToken(newToken);
    } else {
      localStorage.removeItem("token");
      setToken("");
    }
  };

  // Update name
  const updateName = (newName) => {
    if (newName) {
      localStorage.setItem("name", newName);
      setName(newName);
    } else {
      localStorage.removeItem("name");
      setName("");
    }
  };

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
    removeFromCart,
    navigate,
    backendUrl,
    token,
    setToken: updateToken,
    setCartItems,
    name,
    setName: updateName,
    productsAvailable,
    handleLogin,
    logout: handleLogout,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

ShopContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

const handleError = (error) => {
  console.error("Error:", error);
};

export default ShopContextProvider;
