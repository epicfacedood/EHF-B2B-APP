import mongoose from "mongoose";

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
    unique: true,
    sparse: true,
  },
  phone: {
    type: String,
    default: "",
  },
  company: {
    type: String,
    default: "",
  },
  address: {
    type: String,
    default: "",
  },
  cartData: {
    type: Map,
    of: Map,
    default: new Map(),
  },
  productsAvailable: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster lookups
userSchema.index({ email: 1, customerId: 1 });

// Virtual for full address
userSchema.virtual("fullAddress").get(function () {
  const addr = this.address;
  if (!addr) return "";
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`;
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

const userModel = mongoose.model("users", userSchema);

export default userModel;
