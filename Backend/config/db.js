import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("DB connection successful");
  } catch (err) {
    console.log("DB connection unsuccessful");
    console.log(err);
    process.exit(1);
  }
};

export default connectDB;
