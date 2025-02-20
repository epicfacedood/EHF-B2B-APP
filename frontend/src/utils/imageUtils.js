const getProductImage = (pcode, index = 0) => {
  if (!pcode) {
    console.warn("No pcode provided to getProductImage");
    return null;
  }

  // If it's a Cloudinary URL, return it directly
  if (pcode.startsWith("http")) {
    return pcode;
  }

  // Return placeholder image instead of no-image.png
  return `/productImages/placeholder.jpg`;
};

const getFallbackImage = () => {
  return `/productImages/placeholder.jpg`;
};

export { getProductImage, getFallbackImage };
