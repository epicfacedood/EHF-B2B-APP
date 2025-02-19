import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";

const Login = () => {
  const [currentState, setCurrentState] = useState("Sign up");
  const { token, setToken, setName, navigate, backendUrl } =
    useContext(ShopContext);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    customerId: "",
    phone: "",
    company: "",
    address: {
      street: "",
      postalCode: "",
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      // Handle nested address fields
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      console.log(`Updating ${name} to ${value}`);
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Clear any existing auth headers
      delete axios.defaults.headers.common["Authorization"];

      const response = await axios.post(`${backendUrl}/api/user/login`, {
        customerId: formData.customerId,
        password: formData.password,
      });

      console.log("Login response:", response.data);

      if (response.data.success) {
        // Batch state updates together
        const updates = async () => {
          const newToken = response.data.token;
          const userName = response.data.name || "";
          const products = response.data.productsAvailable || [];

          // Update localStorage
          localStorage.setItem("token", newToken);
          localStorage.setItem("name", userName);
          localStorage.setItem("productsAvailable", JSON.stringify(products));

          // Update state
          setToken(newToken);
          setName(userName);

          // Show success message and navigate
          toast.success("Login successful!");
          navigate("/");
        };

        await updates();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed");
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      if (currentState === "Sign up") {
        // Ensure all required fields are present
        if (!formData.phone) {
          toast.error("Phone number is required");
          return;
        }

        // Create a clean registration object
        const registrationData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          customerId: formData.customerId,
          phone: formData.phone.toString(), // Ensure phone is a string
          company: formData.company || "", // Provide default for optional field
          address: {
            street: formData.address.street || "",
            postalCode: formData.address.postalCode || "",
          },
        };

        console.log("Submitting registration data:", registrationData);

        const response = await axios.post(
          `${backendUrl}/api/user/register`,
          registrationData,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.success) {
          setToken(response.data.token);
          setName(formData.name);
          navigate("/");
          toast.success("Registration successful!");
        } else {
          toast.error(response.data.message);
        }
      } else {
        await handleLogin(event);
      }
    } catch (error) {
      console.error("Form submission error:", error.response?.data || error);
      toast.error(error.response?.data?.message || "An error occurred");
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-600"
    >
      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="prata-regular text-3xl">{currentState}</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>

      {currentState === "Sign up" ? (
        <>
          <input
            name="name"
            onChange={handleChange}
            value={formData.name}
            type="text"
            className="w-full px-3 py-2 border border-gray-800"
            placeholder="Name"
            required
          />

          <input
            name="email"
            onChange={handleChange}
            value={formData.email}
            type="email"
            className="w-full px-3 py-2 border border-gray-800"
            placeholder="Email"
            required
          />

          <input
            name="customerId"
            onChange={handleChange}
            value={formData.customerId}
            type="text"
            className="w-full px-3 py-2 border border-gray-800"
            placeholder="Customer ID"
            required
          />

          <input
            name="phone"
            onChange={handleChange}
            value={formData.phone}
            type="tel"
            className="w-full px-3 py-2 border border-gray-800"
            placeholder="Phone Number"
            required
          />

          <input
            id="company"
            name="company"
            type="text"
            value={formData.company}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-800"
            placeholder="Company Name"
          />

          {/* Address Fields */}
          <div className="w-full space-y-4">
            <input
              name="address.street"
              onChange={handleChange}
              value={formData.address.street}
              type="text"
              className="w-full px-3 py-2 border border-gray-800"
              placeholder="Street Address"
            />

            <input
              name="address.postalCode"
              onChange={handleChange}
              value={formData.address.postalCode}
              type="text"
              className="w-full px-3 py-2 border border-gray-800"
              placeholder="Postal Code"
            />
          </div>
        </>
      ) : (
        // Login form fields
        <input
          name="customerId"
          onChange={handleChange}
          value={formData.customerId}
          type="text"
          className="w-full px-3 py-2 border border-gray-800"
          placeholder="Customer ID"
          required
        />
      )}

      <input
        name="password"
        onChange={handleChange}
        value={formData.password}
        type="password"
        className="w-full px-3 py-2 border border-gray-800"
        placeholder="Password"
        required
      />

      <div className="w-full flex justify-between text-sm mt-[-8px]">
        <p className="cursor-pointer">Forgot your password</p>
        {currentState === "Login" ? (
          <p
            onClick={() => setCurrentState("Sign up")}
            className="cursor-pointer"
          >
            Create account
          </p>
        ) : (
          <p
            onClick={() => setCurrentState("Login")}
            className="cursor-pointer"
          >
            Login here
          </p>
        )}
      </div>

      <button className="bg-black text-white font-light px-8 py-2 mt-4">
        {currentState === "Login" ? "Sign in" : "Sign up"}
      </button>
    </form>
  );
};

export default Login;
