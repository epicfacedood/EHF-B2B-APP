const getProductImage = (pcode) => {
  if (!pcode) return null;
  const imagePath = `/productImages/${pcode.toUpperCase()}.jpg`;
  console.log("Attempting to load image:", imagePath); // Debug log
  return imagePath;
};

const getFallbackImage = () => {
  return `/productImages/no-image.png`;
};

export { getProductImage, getFallbackImage };
