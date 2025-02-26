// Add a message when no products are available

{
  products.length === 0 && (
    <div className="text-center py-10">
      <h2 className="text-xl font-semibold text-gray-600">
        No Products Available
      </h2>
      <p className="mt-2 text-gray-500">
        There are no products available in your price list. Please contact your
        account manager for assistance.
      </p>
    </div>
  );
}
