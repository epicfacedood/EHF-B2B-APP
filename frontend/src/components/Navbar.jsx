import React, { useContext } from "react";
import { assets } from "../assets/assets";
import { NavLink, Link } from "react-router-dom";
import { useState } from "react";
import { ShopContext } from "../context/ShopContext";
import PropTypes from "prop-types";

const Navbar = ({ setToken }) => {
  const [visible, setVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const {
    showSearch,
    setShowSearch,
    getCartCount,
    navigate,
    token,
    setCartItems,
  } = useContext(ShopContext);

  const handleLogout = () => {
    if (typeof setToken === "function") {
      setToken("");
    }
    navigate("/login");
    setCartItems({});
  };

  const handleProfileClick = (e) => {
    // Only handle click for mobile screens
    if (window.innerWidth < 640) {
      // 640px is Tailwind's sm breakpoint
      e.preventDefault(); // Prevent default link behavior
      if (token) {
        setProfileVisible(true);
      } else {
        navigate("/login");
      }
    }
  };

  return (
    <div className="flex items-center justify-between py-5 font-medium z-50 relative">
      <Link to="/">
        <img src={assets.logo} className="w-24 h-auto" alt="asdf" />
      </Link>
      <ul className="hidden sm:flex gap-5 text-sm text-gray-700">
        <NavLink to="/" className="flex flex-col items-center gap-1">
          <p>Home</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>
        <NavLink to="/Collection" className="flex flex-col items-center gap-1">
          <p>Collection</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>
        <NavLink to="/About" className="flex flex-col items-center gap-1">
          <p>About</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>
        <NavLink to="/Contact" className="flex flex-col items-center gap-1">
          <p>Contact</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700 hidden" />
        </NavLink>
      </ul>

      <div className="flex items-center gap-6">
        <div className="group relative">
          <Link to="/login" onClick={handleProfileClick}>
            <img
              className="w-5 cursor-pointer"
              src={assets.profile_icon}
              alt=""
            />
          </Link>
          {token && (
            <div className="hidden group-hover:block dropdown-menu absolute right-0 pt-4">
              <div className="flex flex-col gap-2 w-36 py-3 px-5 bg-slate-100 text-gray-500 rounded">
                <p className="cursor-pointer hover:text-black">My Profile</p>
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
            <p
              className="absolute right-0 bottom-0 translate-x-1/2 translate-y-1/2 
                w-4 text-center leading-4 bg-red-500 text-white 
                aspect-square rounded-full text-[8px] z-30"
            >
              {getCartCount()}
            </p>
          </div>
        </Link>
        <img
          onClick={() => {
            setVisible(true);
          }}
          src={assets.menu_icon}
          className="w-5 cursor-pointer sm:hidden"
          alt=""
        />
      </div>

      {/* Mobile profile menu */}
      <div
        className={`fixed sm:hidden top-0 right-0 bottom-0 overflow-y-auto bg-white transition-all ${
          profileVisible ? "w-full" : "w-0"
        }`}
      >
        <div className="flex flex-col text-gray-600 h-full">
          <div
            onClick={() => {
              setProfileVisible(false);
            }}
            className="flex items-center gap-4 p-3 cursor-pointer border-t border-l border-r"
          >
            <img src={assets.dropdown_icon} className="h-4 rotate-180" alt="" />
            <p>Back</p>
          </div>
          <NavLink
            onClick={() => setProfileVisible(false)}
            className="py-2 pl-6 border-t border-l border-r"
            to="/account"
          >
            My Account
          </NavLink>
          <NavLink
            onClick={() => setProfileVisible(false)}
            className="py-2 pl-6 border-t border-l border-r"
            to="/orders"
          >
            Orders
          </NavLink>
          <NavLink
            onClick={() => {
              setProfileVisible(false);
              handleLogout();
            }}
            className="py-2 pl-6 border-t border-l border-r border-b"
            to="/about"
          >
            Logout
          </NavLink>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`fixed sm:hidden top-0 right-0 bottom-0 overflow-y-auto bg-white transition-all ${
          visible ? "w-full" : "w-0"
        } z-50`}
      >
        <div className="flex flex-col text-gray-600 h-full">
          <div
            onClick={() => {
              setVisible(false);
            }}
            className="flex items-center gap-4 p-3 cursor-pointer border-t border-l border-r"
          >
            <img src={assets.dropdown_icon} className="h-4 rotate-180" alt="" />
            <p>Back</p>
          </div>
          <NavLink
            onClick={() => setVisible(false)}
            className="py-2 pl-6 border-t border-l border-r"
            to="/"
          >
            Home
          </NavLink>
          <NavLink
            onClick={() => setVisible(false)}
            className="py-2 pl-6 border-t border-l border-r"
            to="/collection"
          >
            Collection
          </NavLink>
          <NavLink
            onClick={() => setVisible(false)}
            className="py-2 pl-6 border-t border-l border-r"
            to="/about"
          >
            About
          </NavLink>
          <NavLink
            onClick={() => setVisible(false)}
            className="py-2 pl-6 border"
            to="/contact"
          >
            Contact
          </NavLink>
          <NavLink
            onClick={() => setProfileVisible(false)}
            className="py-2 pl-6 border-t border-l border-r"
            to="/account"
          >
            My Account
          </NavLink>
        </div>
      </div>
    </div>
  );
};

Navbar.propTypes = {
  setToken: PropTypes.func.isRequired,
};

export default Navbar;
