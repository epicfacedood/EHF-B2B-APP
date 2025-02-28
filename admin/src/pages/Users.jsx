import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

const Users = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const PRICE_LIST_API_KEY =
    import.meta.env.VITE_PRICE_LIST_API_KEY || "price-list-api-key-123";

  useEffect(() => {
    fetchUsers();
  }, [token, backendUrl, navigate]);

  const fetchUsers = async (retryCount = 0) => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/user/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          includePriceListInfo: true,
        },
      });

      if (response.data.success) {
        setUsers(response.data.users);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);

      // If we get a 500 error and haven't retried too many times, wait and retry
      if (error.response?.status === 500 && retryCount < 3) {
        toast.info("Connection issue detected. Retrying in 3 seconds...");
        setTimeout(() => {
          fetchUsers(retryCount + 1);
        }, 3000);
        return;
      }

      toast.error("Failed to load users");
      if (error.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSyncPriceLists = async () => {
    try {
      setSyncing(true);
      setSyncLoading(true);

      const apiKey = import.meta.env.VITE_PRICE_LIST_API_KEY;

      if (!apiKey) {
        toast.error("API key not configured");
        return;
      }

      const response = await axios.post(
        `${backendUrl}/api/pricelist/sync`,
        {},
        {
          headers: {
            "X-API-Key": apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        // Show loading spinner for 5 seconds
        setTimeout(() => {
          setSyncLoading(false);
          fetchUsers();
          toast.success("Price list sync completed successfully");
        }, 5000);
      } else {
        toast.error("Failed to sync price lists");
        setSyncLoading(false);
      }
    } catch (error) {
      console.error("Error syncing price lists:", error);
      // Add more detailed error logging
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }

      let errorMessage = "Failed to sync price lists";

      // Show more specific error message based on status code
      if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Check API key configuration.";
      } else if (error.response?.status === 403) {
        errorMessage =
          "Permission denied. Your API key may not have sufficient privileges.";
      }

      toast.error(errorMessage);
      setSyncLoading(false);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Users</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all users in the system
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex items-center">
          <button
            type="button"
            onClick={handleSyncPriceLists}
            disabled={syncing || syncLoading}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              syncing || syncLoading
                ? "bg-gray-400"
                : "bg-blue-600 hover:bg-blue-700"
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {syncing || syncLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Syncing...
              </span>
            ) : (
              "Sync Price Lists"
            )}
          </button>
        </div>
      </div>

      <div className="mt-8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-1/5 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="w-1/5 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="w-1/6 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer ID
                </th>
                <th className="hidden md:table-cell w-1/6 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="w-[8%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price List
                </th>
                <th className="hidden sm:table-cell w-[10%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="w-[8%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 truncate">
                    <div
                      className="text-sm font-medium text-gray-900 truncate"
                      title={user.name}
                    >
                      {user.name}
                    </div>
                  </td>
                  <td className="px-3 py-4 truncate">
                    <div
                      className="text-sm text-gray-500 truncate"
                      title={user.email}
                    >
                      {user.email}
                    </div>
                  </td>
                  <td className="px-3 py-4 truncate">
                    <div
                      className="text-sm text-gray-500 truncate"
                      title={user.customerId || "N/A"}
                    >
                      {user.customerId || "N/A"}
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-3 py-4 truncate">
                    <div className="text-sm text-gray-500 truncate">
                      {user.address && typeof user.address === "object" ? (
                        <span
                          title={`${user.address.street || ""} ${
                            user.address.postalCode || ""
                          }`}
                        >
                          {user.address.street || ""}
                          {user.address.street && user.address.postalCode
                            ? ", "
                            : ""}
                          {user.address.postalCode || ""}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    {user.inPriceList ? (
                      <CheckCircleIcon
                        className="h-5 w-5 text-green-500"
                        aria-hidden="true"
                      />
                    ) : (
                      <span className="text-xs text-gray-500">No</span>
                    )}
                  </td>
                  <td className="hidden sm:table-cell px-3 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-4 text-sm font-medium">
                    <button
                      onClick={() => navigate(`/users/${user._id}`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
