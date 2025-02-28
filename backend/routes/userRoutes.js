router.get("/profile", isAuth, async (req, res) => {
  try {
    // Debug: Log the user ID we're looking for
    console.log("Looking up user with ID:", req.user._id);

    // Get full user document with all fields
    const user = await User.findById(req.user._id).lean();

    // Debug: Log the full user document
    console.log("Found user document:", JSON.stringify(user, null, 2));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return all fields for debugging
    return res.json({
      success: true,
      user: user,
      debug: {
        allFields: Object.keys(user),
        hasCustomerId: !!user.customerId,
        customerIdValue: user.customerId,
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching profile",
    });
  }
});
