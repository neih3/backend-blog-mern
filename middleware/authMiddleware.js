/**
 * Created by trungquandev.com's author on 16/10/2019.
 * src/controllers/auth.js
 */
const { verifyToken } = require("../helpers/jwt.helpers");
const User = require("../models/User");

let isAuth = async (req, res, next) => {
  try {
    // Lấy token từ header Authorization
    const token = req.headers.authorization.split(" ")[1]; // "Bearer <token>"

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authorization token is required" });
    }

    // Giải mã token
    const decoded = await verifyToken(token, "hien"); // 'hien' là secret key bạn đã sử dụng để tạo token

    // Lấy email từ token
    const userEmail = decoded.data.email;

    // Tìm người dùng trong database
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Lưu thông tin người dùng vào request để sử dụng trong các route tiếp theo
    req.user = user;

    // Chuyển sang middleware hoặc route tiếp theo
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res
      .status(401)
      .json({ message: "Invalid or expired token", error: error.message });
  }
};

module.exports = {
  isAuth: isAuth,
};
