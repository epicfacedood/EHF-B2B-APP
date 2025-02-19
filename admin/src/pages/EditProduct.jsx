import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import { backendUrl } from "../components/Login";
import { assets } from "../assets/assets";

const EditProduct = ({ token }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [itemName, setItemName] = useState("");
  const [pcode, setPcode] = useState("");
  const [price, setPrice] = useState("");
  const [baseUnit, setBaseUnit] = useState("");
  const [packagingSize, setPackagingSize] = useState("");
  const [uom, setUom] = useState("");
  const [uoms, setUoms] = useState("");
  const [category, setCategory] = useState("BDI");
  const [bestseller, setBestSeller] = useState(false);

  // Image states
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [image3, setImage3] = useState(null);
  const [image4, setImage4] = useState(null);

  // Image preview URLs
  const [preview1, setPreview1] = useState("");
  const [preview2, setPreview2] = useState("");
  const [preview3, setPreview3] = useState("");
  const [preview4, setPreview4] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.post(
          `${backendUrl}/api/product/single`,
          { productId: id },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          const product = response.data.product;
          // Set form data
          setItemName(product.itemName || "");
          setPcode(product.pcode || "");
          setPrice(product.price || "");
          setBaseUnit(product.baseUnit || "");
          setPackagingSize(product.packagingSize || "");
          setUom(product.uom || "");
          setUoms(product.uoms || "");
          setCategory(product.category || "BDI");
          setBestSeller(product.bestseller || false);

          // Set image previews
          setPreview1(product.image?.[0] || "");
          setPreview2(product.image?.[1] || "");
          setPreview3(product.image?.[2] || "");
          setPreview4(product.image?.[3] || "");
        } else {
          toast.error("Failed to fetch product");
          navigate("/list");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error(error.message);
        navigate("/list");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("itemName", itemName);
      formData.append("pcode", pcode);
      formData.append("price", price);
      formData.append("baseUnit", baseUnit);
      formData.append("packagingSize", packagingSize);
      formData.append("uom", uom);
      formData.append("uoms", uoms);
      formData.append("category", category);
      formData.append("bestseller", bestseller);

      // Only append images if they were changed
      image1 && formData.append("image1", image1);
      image2 && formData.append("image2", image2);
      image3 && formData.append("image3", image3);
      image4 && formData.append("image4", image4);

      const response = await axios.post(
        `${backendUrl}/api/product/update/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("Product updated successfully");
        navigate("/list");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold">Edit Product</h3>
        <button
          onClick={() => navigate("/list")}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Back to Products
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Name
              </label>
              <input
                type="text"
                name="itemName"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Code
              </label>
              <input
                type="text"
                name="pcode"
                value={pcode}
                onChange={(e) => setPcode(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Price
              </label>
              <input
                type="number"
                name="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Base Unit
              </label>
              <input
                type="text"
                name="baseUnit"
                value={baseUnit}
                onChange={(e) => setBaseUnit(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Packaging Size
              </label>
              <input
                type="text"
                name="packagingSize"
                value={packagingSize}
                onChange={(e) => setPackagingSize(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                UOM
              </label>
              <input
                type="text"
                name="uom"
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                UOMs (comma separated)
              </label>
              <input
                type="text"
                name="uoms"
                value={uoms}
                onChange={(e) => setUoms(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="bestseller"
              checked={bestseller}
              onChange={(e) => setBestSeller(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label className="ml-2 text-sm text-gray-700">Bestseller</label>
          </div>

          <div>
            <p className="mb-2">Upload Images</p>
            <div className="flex gap-2">
              <label htmlFor="image1">
                <img
                  className="w-20"
                  src={
                    image1
                      ? URL.createObjectURL(image1)
                      : preview1 || assets.upload_area
                  }
                  alt=""
                />
                <input
                  onChange={(e) => setImage1(e.target.files[0])}
                  type="file"
                  id="image1"
                  hidden
                />
              </label>
              <label htmlFor="image2">
                <img
                  className="w-20"
                  src={
                    image2
                      ? URL.createObjectURL(image2)
                      : preview2 || assets.upload_area
                  }
                  alt=""
                />
                <input
                  onChange={(e) => setImage2(e.target.files[0])}
                  type="file"
                  id="image2"
                  hidden
                />
              </label>
              <label htmlFor="image3">
                <img
                  className="w-20"
                  src={
                    image3
                      ? URL.createObjectURL(image3)
                      : preview3 || assets.upload_area
                  }
                  alt=""
                />
                <input
                  onChange={(e) => setImage3(e.target.files[0])}
                  type="file"
                  id="image3"
                  hidden
                />
              </label>
              <label htmlFor="image4">
                <img
                  className="w-20"
                  src={
                    image4
                      ? URL.createObjectURL(image4)
                      : preview4 || assets.upload_area
                  }
                  alt=""
                />
                <input
                  onChange={(e) => setImage4(e.target.files[0])}
                  type="file"
                  id="image4"
                  hidden
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/list")}
              className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

EditProduct.propTypes = {
  token: PropTypes.string.isRequired,
};

export default EditProduct;
