const getProductImage = (pcode, index = 0) => {
  // Add logging to debug
  console.log("Getting product image:", { pcode, index });
  // If the image is a full URL (like from Cloudinary), return it directly
  if (pcode?.startsWith("http")) {
    return pcode;
  }
  if (!pcode) return null;
  const imagePath = `/productImages/${pcode.toUpperCase()}.jpg`;
  console.log("Attempting to load image:", imagePath); // Debug log
  return imagePath;
};

const getFallbackImage = () => {
  return `/productImages/no-image.png`;
};

export { getProductImage, getFallbackImage };
