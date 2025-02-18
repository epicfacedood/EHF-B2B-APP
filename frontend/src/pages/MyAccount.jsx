import React, { useState, useEffect, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import Title from "../components/Title";

const MyAccount = () => {
  const { backendUrl, token } = useContext(ShopContext);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      console.log("Token:", token);

      const response = await axios.get(`${backendUrl}/api/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setUserData(response.data.user);
      }
    } catch (error) {
      console.error("Full error:", error);
      console.error("Error response:", error.response);
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Title text1="MY" text2="ACCOUNT" />

      <div className="mt-8 space-y-6 bg-white p-6 rounded-lg shadow">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Account Details
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <p className="mt-1 p-2 bg-gray-50 rounded-md">
                  {userData?.name || "Not provided"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <p className="mt-1 p-2 bg-gray-50 rounded-md">
                  {userData?.email || "Not provided"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Customer ID
                </label>
                <p className="mt-1 p-2 bg-gray-50 rounded-md">
                  {userData?.customerId || "Not provided"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Address Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {userData?.address && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Street
                    </label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-md">
                      {userData.address.street || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Postal Code
                    </label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-md">
                      {userData.address.postalCode || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-md">
                      {userData.address.country || "Not provided"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {userData?.phoneNumber && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <p className="mt-1 p-2 bg-gray-50 rounded-md">
                {userData.phoneNumber}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAccount;
