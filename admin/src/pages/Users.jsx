import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

const Users = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
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

      const response = await axios.post(
        `${backendUrl}/api/pricelist/sync`,
        {},
        {
          headers: {
            "X-API-Key": PRICE_LIST_API_KEY,
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        // Wait a bit and then refresh the user list to show updated price list status
        setTimeout(() => {
          fetchUsers();
        }, 5000);
      } else {
        toast.error("Failed to sync price lists");
      }
    } catch (error) {
      console.error("Error syncing price lists:", error);
      toast.error(`Failed to sync price lists: ${error.message}`);
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
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={handleSyncPriceLists}
            disabled={syncing}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              syncing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {syncing ? "Syncing..." : "Sync Price Lists"}
          </button>
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      In Price List
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {user.customerId || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {user.address && typeof user.address === "object" ? (
                            <>
                              {user.address.street || ""}
                              {user.address.street && user.address.postalCode
                                ? ", "
                                : ""}
                              {user.address.postalCode || ""}
                            </>
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.inPriceList && (
                          <CheckCircleIcon
                            className="h-5 w-5 text-green-500"
                            aria-hidden="true"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
      </div>
    </div>
  );
};

export default Users;
