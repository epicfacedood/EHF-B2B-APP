import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  customerId: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    default: "",
  },
  address: {
    street: {
      type: String,
      default: "",
    },
    postalCode: {
      type: String,
      default: "",
    },
  },
  role: {
    type: String,
    default: "",
  },
  cartData: {
    type: Object,
    default: {},
  },
  productsAvailable: [
    {
      type: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  __v: {
    type: Number,
    default: 0,
  },
});

// Add debug logs to pre-save hook
userSchema.pre("save", async function (next) {
  console.log("Pre-save hook triggered");
  console.log("Is password modified?", this.isModified("password"));
  console.log("Original password:", this.password);

  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log("Hashed password in pre-save:", this.password);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    console.log("Comparing passwords:");
    console.log("Candidate password:", candidatePassword);
    console.log("Stored hash:", this.password);
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log("Password match result:", isMatch);
    return isMatch;
  } catch (error) {
    throw error;
  }
};

// Index for faster lookups
userSchema.index({ email: 1, customerId: 1 });

// Virtual for full address
userSchema.virtual("fullAddress").get(function () {
  const addr = this.address;
  if (!addr) return "";
  return `${addr.street}, ${addr.postalCode}`;
});

// Method to check if a product is available to this user
userSchema.methods.hasAccessToProduct = function (pcode) {
  return this.productsAvailable.includes(pcode);
};

// Ensure virtual fields are included when converting to JSON
userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.password;
    return ret;
  },
});

const userModel = mongoose.model("User", userSchema);

export default userModel;
