const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(
    process.env.MONGO_URI,
  ); // Connect to MongoDB using the connection string from environment variables 

  console.log("MongoDB connected");
};

module.exports = connectDB;
