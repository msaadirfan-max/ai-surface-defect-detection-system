require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const connectDB = require("./config/db");
const inspectionRoutes = require("./routes/api/inspect/inspection");
const adminRoutes = require("./routes/admin");
const inspectRoutes = require("./routes/register/login/inspect");
const errorHandler = require("./middleware/errorHandler");

const app = express();
connectDB();

app.use(express.json());   // Parse incoming JSON requests
app.use(cors());         // Enable CORS for cross-origin requests

app.use("/api/admin", adminRoutes);
app.use("/api/inspect", inspectRoutes);  // For image upload and to get inspection results

app.use("/auth", authRoutes);         // For user registration and login
app.use("/api/inspections", inspectionRoutes); // For fetching inspection records

app.use("/uploads", express.static("uploads"));   // Serve uploaded images statically

app.use((req, res, next) => {    // Catch-all route for undefined endpoints
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});



app.use(errorHandler);   // Custom error handling middleware

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
