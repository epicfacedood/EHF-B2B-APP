export const formatPrice = (price) => {
  if (!price && price !== 0) return "";
  return Number(price).toFixed(2);
};

export const formatPackagingSize = (size) => {
  if (!size || size === "NaN" || size === "undefined") return "";
  return size;
};
