import React, { useContext } from "react";
import { assets } from "../assets/assets";
import { NavLink, Link } from "react-router-dom";
import { useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";

const Navbar = () => {
  const [visible, setVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const { showSearch, setShowSearch, getCartCount, navigate, token, logout } =
    useContext(ShopContext);

  const handleLogout = () => {
    try {
      logout();
      setProfileVisible(false);
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out");
    }
  };

  const handleProfileClick = () => {
    if (!token) {
      navigate("/login");
    }
    setProfileVisible(!profileVisible);
  };

  return (
    <div className="flex items-center justify-between py-5 font-medium z-50 relative">
      <Link to="/">
        <img src={assets.logo} className="w-24 h-auto" alt="Logo" />
      </Link>
      <ul className="hidden sm:flex gap-5 text-sm text-gray-700">
        <NavLink to="/" className="flex flex-col items-center gap-1">
          <p>Home</p>
        </NavLink>
        <NavLink to="/collection" className="flex flex-col items-center gap-1">
          <p>Collection</p>
        </NavLink>
        <NavLink to="/about" className="flex flex-col items-center gap-1">
          <p>About</p>
        </NavLink>
        <NavLink to="/contact" className="flex flex-col items-center gap-1">
          <p>Contact</p>
        </NavLink>
      </ul>

      <div className="flex items-center gap-6">
        {token ? (
          <>
            <div className="group relative">
              <Link to="/login" onClick={handleProfileClick}>
                <img
                  className="w-5 cursor-pointer"
                  src={assets.profile_icon}
                  alt="Profile"
                />
              </Link>
              {profileVisible && (
                <div className="hidden group-hover:block dropdown-menu absolute right-0 pt-4">
                  <div className="flex flex-col gap-2 w-36 py-3 px-5 bg-slate-100 text-gray-500 rounded">
                    <p className="cursor-pointer hover:text-black">
                      My Profile
                    </p>
                    <p
                      onClick={() => navigate("/orders")}
                      className="cursor-pointer hover:text-black"
                    >
                      Orders
                    </p>

                    <p
                      onClick={handleLogout}
                      className="cursor-pointer hover:text-black"
                    >
                      Logout
                    </p>
                  </div>
                </div>
              )}
            </div>
            <Link to="/cart">
              <div className="relative w-5">
                <img src={assets.cart_icon} className="w-5" alt="Cart" />
                <p className="absolute right-0 bottom-0 translate-x-1/2 translate-y-1/2 w-4 text-center leading-4 bg-red-500 text-white aspect-square rounded-full text-[8px] z-30">
                  {getCartCount()}
                </p>
              </div>
            </Link>
          </>
        ) : (
          <Link to="/login">
            <img
              className="w-5 cursor-pointer"
              src={assets.profile_icon}
              alt="Login"
            />
          </Link>
        )}
      </div>
    </div>
  );
};

export default Navbar;
