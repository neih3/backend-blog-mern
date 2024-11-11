require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const authRouter = require("./routes/authRoutes");
const blogRouter = require("./routes/blogRoutes");
const commentRouter = require("./routes/commentRoutes");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { errorHandler } = require("./controllers/errorController");

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://your-frontend-domain.com"], // Thay bằng domain frontend của bạn
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // Cho phép gửi cookie qua CORS nếu cần
  })
);

app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Routes
app.use(authRouter);
app.use("/v1/blog", blogRouter);
app.use("/v1/comment", commentRouter);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup error:", error);
  }
};

startServer();

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});
