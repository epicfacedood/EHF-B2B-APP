export const fetchProducts = async () => {
  try {
    const token = localStorage.getItem("token"); // Or however you store your token

    const response = await axios.get(`${API_URL}/api/product/list`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};
