import PriceList from "../models/priceListModel.js";

/**
 * Check if a user has access to a specific product
 * @param {string} customerId - The customer ID of the user
 * @param {string} productCode - The product code to check
 * @returns {Promise<boolean>} - True if the user has access, false otherwise
 */
export const userHasAccessToProduct = async (customerId, productCode) => {
  if (!customerId || !productCode) {
    return false;
  }

  const priceListItem = await PriceList.findOne({
    customerId: customerId,
    itemNo: productCode,
  });

  return !!priceListItem;
};

/**
 * Get all product codes a user has access to
 * @param {string} customerId - The customer ID of the user
 * @returns {Promise<string[]>} - Array of product codes the user has access to
 */
export const getAccessibleProductCodes = async (customerId) => {
  if (!customerId) {
    return [];
  }

  const priceListItems = await PriceList.find({ customerId: customerId });
  return priceListItems.map((item) => item.itemNo);
};
