const { generateToken, verifyToken } = require("../helpers/jwt.helpers");
const User = require("../models/User");
const Blog = require("../models/Blog");
const Token = require("../models/Token");
const { sendEmail } = require("../helpers/email.helper");
const { v4: uuidv4 } = require("uuid");
const createError = require("http-errors");
require("dotenv").config();

// Xử lý lỗi validation
const handleValidationErrors = (err) => {
  const errors = { email: "", password: "" };

  if (err.message === "incorrect email") {
    errors.email = "Email không tồn tại";
  }

  if (err.message === "incorrect password") {
    errors.password = "Mật khẩu không chính xác";
  }

  if (err.code === 11000) {
    errors.email = "Email đã được đăng ký";
  }

  if (err.message.includes("user validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};

// Controllers
module.exports = {
  async refreshToken(req, res, next) {
    const refreshTokenFromClient = req.body.refresh_token;

    if (!refreshTokenFromClient) {
      return next(createError(403, "Không có refresh token"));
    }

    try {
      const decoded = await verifyToken(
        refreshTokenFromClient,
        process.env.SECRET_JWT
      );
      const { email, role } = decoded.data;

      const user = await User.findOne({
        email,
        refreshToken: refreshTokenFromClient,
      });

      if (!user) {
        throw createError(403, "Refresh token không hợp lệ");
      }

      const accessToken = await generateToken(
        { email, role },
        process.env.SECRET_JWT,
        "100s"
      );
      res.status(200).json({ accessToken });
    } catch (error) {
      next(createError(403, "Refresh token không hợp lệ"));
    }
  },

  async signup_post(req, res, next) {
    const { email, password, name, role } = req.body;

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw createError(409, "Email đã được đăng ký");
      }

      const user = await User.create({ email, password, name, role });
      const token = await Token.create({
        userId: user._id,
        token: uuidv4(),
      });

      const verificationUrl = `http://localhost:3000/signup/${token.token}`;
      await sendEmail(user.email, "Xác thực Email", verificationUrl);

      res.status(201).json({
        message: "Email xác thực đã được gửi. Vui lòng kiểm tra email của bạn.",
      });
    } catch (err) {
      next(err);
    }
  },

  async verified_user(req, res, next) {
    try {
      const token = await Token.findOne({ token: req.params.token });
      if (!token) {
        throw createError(400, "Token không hợp lệ hoặc đã hết hạn");
      }

      const user = await User.findById(token.userId);
      if (!user) {
        throw createError(400, "Người dùng không tồn tại");
      }

      user.verified = true;
      await user.save();
      await Token.findByIdAndRemove(token._id);

      res.status(200).send("Email đã được xác thực thành công");
    } catch (error) {
      next(error);
    }
  },

  async forget_password(req, res) {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        throw createError(404, "Email không tồn tại");
      }

      let token = await Token.findOne({ userId: user._id });
      if (!token) {
        token = await Token.create({
          userId: user._id,
          token: uuidv4(),
        });
      }

      const resetUrl = `http://localhost:5173/password-reset/${token.token}`;
      await sendEmail(user.email, "Đặt lại mật khẩu", resetUrl);

      res.status(200).json({
        message: "Link đặt lại mật khẩu đã được gửi đến email của bạn",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async verified_password(req, res, next) {
    try {
      const token = await Token.findOne({ token: req.params.token });
      if (!token) {
        return res
          .status(400)
          .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
      }

      const user = await User.findById(token.userId);
      if (!user) {
        return res.status(400).json({ message: "Người dùng không tồn tại" });
      }

      if (!user.verified) {
        return res
          .status(400)
          .json({ message: "Tài khoản chưa được xác thực" });
      }

      user.password = req.body.password;
      await user.save();
      await Token.findByIdAndRemove(token._id);

      res.status(200).json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
      next(createError(500, "Lỗi server"));
    }
  },

  async login_post(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.login(email, password);

      if (!user.verified) {
        return res
          .status(403)
          .json({ message: "Vui lòng xác thực email trước khi đăng nhập" });
      }

      const accessToken = await generateToken(
        { email: user.email, role: user.role },
        process.env.SECRET_JWT,
        "10s"
      );
      const refreshToken = await generateToken(
        { email: user.email, role: user.role },
        process.env.SECRET_JWT,
        "3650d"
      );

      user.refreshToken = refreshToken;
      await user.save();

      res.status(200).json({
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          verified: user.verified,
          avatar: user.avatar,
          bio: user.bio,
        },
        accessToken,
        refreshToken,
      });
    } catch (err) {
      const errors = handleValidationErrors(err);
      res.status(400).json({ errors });
    }
  },

  async getUser(req, res) {
    try {
      if (!req.user) {
        throw createError(404, "Không tìm thấy người dùng");
      }
      res.status(200).json(req.user);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  },

  async getAllUsers(req, res) {
    try {
      const users = await User.find().select("-password -refreshToken");
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteUser(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      await user.deleteOne();
      res.status(200).json({ message: "Xóa người dùng thành công" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateUser(req, res) {
    try {
      const { name, avatar, bio } = req.body;
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      if (name) user.name = name;
      if (avatar) user.avatar = avatar;
      if (bio) user.bio = bio;

      const updatedUser = await user.save();

      res.status(200).json({
        message: "Cập nhật thông tin thành công",
        user: {
          _id: updatedUser._id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          avatar: updatedUser.avatar,
          bio: updatedUser.bio,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async toggleBlog(req, res) {
    try {
      const user = await User.findById(req.user._id);
      const blog = await Blog.findById(req.body._id);

      if (!user || !blog) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy người dùng hoặc bài viết" });
      }

      const isBookmarked = user.blogsSaved.includes(blog._id);
      const operation = isBookmarked ? "$pull" : "$push";

      await Promise.all([
        User.updateOne(
          { _id: user._id },
          { [operation]: { blogsSaved: blog._id } }
        ),
        Blog.updateOne(
          { _id: blog._id },
          { [operation]: { userSavedBlogs: user._id } }
        ),
      ]);

      res.status(200).json({
        message: isBookmarked ? "Đã bỏ lưu bài viết" : "Đã lưu bài viết",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async toggleLikes(req, res) {
    try {
      const user = await User.findById(req.user._id);
      const blog = await Blog.findById(req.body._id);

      if (!user || !blog) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy người dùng hoặc bài viết" });
      }

      const isLiked = user.likes.includes(blog._id);
      const operation = isLiked ? "$pull" : "$push";

      await Promise.all([
        User.updateOne({ _id: user._id }, { [operation]: { likes: blog._id } }),
        Blog.updateOne(
          { _id: blog._id },
          { [operation]: { userLikesBlogs: user._id } }
        ),
      ]);

      res.status(200).json({
        message: isLiked ? "Đã bỏ thích bài viết" : "Đã thích bài viết",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};
