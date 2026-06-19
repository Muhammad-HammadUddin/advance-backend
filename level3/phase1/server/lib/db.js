

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connection established successfully.");
    console.log(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("MongoDB connection failed.");
    console.log(process.env.MONGODB_URI)
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

export default connectDB;