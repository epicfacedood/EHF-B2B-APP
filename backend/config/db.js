import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log("DB CONNECTED");
    return conn;
  } catch (error) {
    console.error(`Error in MongoDB connection: ${error}`);
    process.exit(1);
  }
};

export default connectDB;
