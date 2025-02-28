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
  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });
  const [name, setName] = useState(localStorage.getItem("name") || "");
  const [productsAvailable, setProductsAvailable] = useState(
    JSON.parse(localStorage.getItem("productsAvailable")) || []
  );
  const [userCustomerId, setUserCustomerId] = useState(null);
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

    try {
      const prevCartItems = { ...cartItems };

      // Create optimistic update
      const updatedCart = { ...cartItems };
      if (!updatedCart[itemId]) {
        updatedCart[itemId] = {};
      }

      // Update the quantity for the specific UOM
      const currentQty = updatedCart[itemId][size.uom] || 0;
      updatedCart[itemId][size.uom] = currentQty + size.quantity;

      // Update state immediately for better UX
      setCartItems(updatedCart);

      const response = await axios.post(
        `${backendUrl}/api/cart/add`,
        {
          itemId,
          size: {
            uom: size.uom,
            quantity: size.quantity,
            qtyPerUOM: size.qtyPerUOM,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data.success) {
        setCartItems(prevCartItems);
        toast.error(response.data.message || "Failed to add item to cart");
      }
    } catch (error) {
      setCartItems(prevCartItems);
      console.error("Add to cart error:", error);
      toast.error("Failed to add item to cart");
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
  const updateQuantity = async (itemId, newQuantity, uom) => {
    if (!token) {
      toast.error("Please login to update cart");
      return;
    }

    try {
      // Store previous cart state for rollback
      const previousCartItems = { ...cartItems };

      // Create optimistic update
      const updatedCart = { ...cartItems };
      if (newQuantity === 0) {
        // Remove the UOM if quantity is 0
        if (updatedCart[itemId]) {
          delete updatedCart[itemId][uom];
          // Remove the product if no UOMs left
          if (Object.keys(updatedCart[itemId]).length === 0) {
            delete updatedCart[itemId];
          }
        }
      } else {
        // Initialize product entry if it doesn't exist
        if (!updatedCart[itemId]) {
          updatedCart[itemId] = {};
        }
        // Update the quantity for the specific UOM
        updatedCart[itemId][uom] = newQuantity;
      }

      // Update state immediately for better UX
      setCartItems(updatedCart);

      const response = await axios.post(
        `${backendUrl}/api/cart/update`,
        {
          itemId,
          size: {
            uom,
            quantity: newQuantity,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data.success) {
        // Revert to previous state if operation failed
        setCartItems(previousCartItems);
        toast.error(response.data.message || "Failed to update cart");
      }
    } catch (error) {
      // Revert to previous state on error
      setCartItems(previousCartItems);
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

      // Call getUserCustomerId after setting the token
      setTimeout(() => getUserCustomerId(), 500);
    }
    return data;
  };

  const handleLogout = () => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();

    // Reset states
    setToken(null);
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
      getUserCustomerId();
    }
  }, []);

  // Update token
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

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

  const getUserCustomerId = async () => {
    if (!token) {
      console.log("Cannot fetch customer ID: No token available");
      return null;
    }

    try {
      console.log(
        "Fetching user profile from:",
        `${backendUrl}/api/user/profile`
      );

      // First try to get the user profile from the current API
      const response = await axios.get(`${backendUrl}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("User profile response:", response.data);

      if (response.data.success && response.data.user) {
        // Check if customerId exists in the current user object
        if (response.data.user.customerId) {
          console.log(
            "Found customerId in user profile:",
            response.data.user.customerId
          );
          setUserCustomerId(response.data.user.customerId);
          return response.data.user.customerId;
        }

        // If not, try to fetch the updated user data from MongoDB
        console.log("Fetching updated user data from MongoDB...");
        const userId = response.data.user._id;
        const email = response.data.user.email;

        // Make a request to a new endpoint that fetches the latest user data
        const updatedUserResponse = await axios.get(
          `${backendUrl}/api/user/latest-profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { userId, email },
          }
        );

        if (updatedUserResponse.data.success && updatedUserResponse.data.user) {
          console.log("Updated user data:", updatedUserResponse.data.user);

          if (updatedUserResponse.data.user.customerId) {
            console.log(
              "Found customerId in updated user data:",
              updatedUserResponse.data.user.customerId
            );
            setUserCustomerId(updatedUserResponse.data.user.customerId);
            return updatedUserResponse.data.user.customerId;
          }
        }

        // If still no customerId, use user ID as fallback
        console.log(
          "No customerId found in updated data, using user ID as fallback:",
          userId
        );
        setUserCustomerId(userId);
        return userId;
      } else {
        console.error("Failed to fetch user details:", response.data.message);
        return null;
      }
    } catch (error) {
      console.error("Error fetching user customerId:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
        console.error("Status:", error.response.status);
      }
      if (error.response?.status === 401) {
        handleLogout();
      }
      return null;
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
    setToken,
    setCartItems,
    name,
    setName: updateName,
    productsAvailable,
    setProductsAvailable,
    handleLogin,
    logout: handleLogout,
    userCustomerId,
    getUserCustomerId,
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
