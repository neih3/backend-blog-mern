const { generateToken, verifyToken } = require("../helpers/jwt.helpers");
const User = require("../models/User");
const Blog = require("../models/Blog");
const Token = require("../models/Token");
const { sendEmail } = require("../helpers/email.helper");
var CryptoJS = require("crypto-js");
const { v4: uuidv4 } = require("uuid");
const createError = require("http-errors");
module.exports.refreshToken = async (req, res, next) => {
  const refreshTokenFromClient = req.body.refresh_token;

  if (!refreshTokenFromClient) {
    return next(createError(403, "No refresh token provided"));
  }

  try {
    // Verify the refresh token
    const decoded = await verifyToken(refreshTokenFromClient, "hien");

    const { email } = decoded.data;

    // Find user with the refresh token
    const user = await User.findOne({
      email,
      refreshToken: refreshTokenFromClient,
    });

    if (!user) {
      throw createError(403, "Invalid refresh token");
    }

    // Generate a new access token
    const accessToken = await generateToken({ email }, "hien", "100s");

    // Send the new access token
    res.status(200).json({ accessToken });
  } catch (error) {
    console.log(error);
    next(createError(403, "Invalid refresh token"));
  }
};

const handleErrors = (err) => {
  // console.log(err.code);
  let errors = { email: "", password: "" };

  // incorrect email
  if (err.message === "incorrect email") {
    errors.email = "That email is not registered";
  }

  // incorrect password
  if (err.message === "incorrect password") {
    errors.password = "That password is incorrect";
  }

  if (err.code === 11000) {
    // loi trung email
    errors.email = "that email is already registered";
    return errors;
  }

  // validation errors
  if (err.message.includes("user validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};

module.exports.signup_post = async (req, res, next) => {
  const { email, password, name, role } = req.body;

  try {
    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createError(409, "Email is already registered");
    }

    // Create the user
    const user = await User.create({ email, password, name, role });

    // Generate the verification token
    const token = await new Token({
      userId: user._id,
      token: uuidv4(),
    }).save();

    // Send the verification email
    const message = `http://localhost:3000/signup/${token.token}`;
    await sendEmail(user.email, "Verify Email", message);

    res.status(201).json({
      message:
        "An email has been sent to your account. Please verify your email.",
    });
  } catch (err) {
    // Forward errors to the centralized error handler
    next(err);
  }
};

module.exports.verified_user = async (req, res, next) => {
  try {
    const tokenValue = req.params.token;
    const token = await Token.findOne({ token: tokenValue });

    if (!token) {
      throw createError(400, "Invalid or expired token");
    }

    const user = await User.findOne({ _id: token.userId });
    if (!user) {
      throw createError(400, "Invalid link or user does not exist");
    }

    user.verified = true;
    await user.save();

    // Remove token after verification
    await Token.findByIdAndRemove(token._id);

    res.status(200).send("Email verified successfully");
  } catch (error) {
    next(error); // Pass error to the centralized handler
  }
};

module.exports.forget_password = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    let token = await Token.findOne({ userId: user._id });
    console.log("token", "da chay");

    if (!token) {
      token = await new Token({
        userId: user._id,
        token: uuidv4(), // Generate the token only once
      }).save();
    }

    const link = `http://localhost:5173/password-reset/${token.token}`;
    await sendEmail(user.email, "Password reset", link);

    res.status(200).send("Password reset link sent to your email");
  } catch (error) {
    console.log(error);
  }
};

module.exports.verified_password = async (req, res) => {
  try {
    const tokenValue = req.params.token; // Get the token from the URL params
    const token = await Token.findOne({ token: tokenValue }); // Search for the token

    // Check if the token exists
    if (!token) {
      return res.status(400).send("Invalid or expired token");
    }

    // Find the user associated with the token
    const user = await User.findOne({ _id: token.userId });
    if (!user) {
      return res.status(400).send("Invalid link or user does not exist");
    }

    // If the user is verified, update the password
    if (user.verified === true) {
      // Ensure you are hashing the password if needed
      user.password = await req.body.password; // Use bcrypt to hash the password
      await user.save();
    } else {
      return res.status(400).send("User is not verified");
    }

    // Remove the token after successful verification
    await Token.findByIdAndRemove(token._id);

    res.status(200).send("Password successfully changed");
  } catch (error) {
    next(createError(500, "Internal server error"));
  }
};

module.exports.login_post = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);

    const accessToken = await generateToken(
      { email: user.email, role: user.role },
      "hien",
      "1000s"
    );
    const refreshToken = await generateToken(
      { email: user.email, role: user.role },
      "hien",
      "3650d"
    );
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      user: user,
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
};
module.exports.getUser = async (req, res) => {
  try {
    // req.user đã được gán bởi middleware sau khi xác thực token
    const user = req.user;

    if (user) {
      // Nếu người dùng đã được middleware xác thực và tìm thấy
      res.status(200).json(user);
    } else {
      // Nếu không tìm thấy người dùng (trường hợp này hiếm khi xảy ra vì middleware đã kiểm tra)
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    // Xử lý lỗi
    res.status(500).json({ error: err.message });
  }
};

module.exports.getAllUsers = async (req, res) => {
  try {
    console.log("ok");
    const Users = await User.find();
    res.status(200).json(Users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the user and remove them
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Trigger the pre-remove hook to delete associated blogs

    // Gọi phương thức xóa người dùng (trigger pre-deleteOne hook)
    await user.deleteOne(); // Thay thế cho remove()

    res
      .status(200)
      .json({ message: "User and their blogs deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.updateUser = async (req, res) => {
  try {
    const user = req.user;
    // Update user's information based on the data in req.body
    const { name, avatar, bio } = req.body;

    // Ensure you only update fields that are provided
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (bio) user.bio = bio;

    // Save the updated user information to the database
    const updatedUser = await user.save();

    // Return the updated user information to the client
    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: err.message });
  }
};
module.exports.toggleBlog = async (req, res) => {
  // Toggle Bookmark: Save or Remove Blog
  try {
    const user = req.user;
    const { _id } = req.body; // Blog ID from request body

    const userMongo = await User.findById(user._id);
    const blogMongo = await Blog.findById(_id);
    // Check if the blog is already saved
    if (userMongo.blogsSaved.includes(_id)) {
      // If it is already saved, remove it (unbookmark)
      await userMongo.updateOne({ $pull: { blogsSaved: _id } });
      await blogMongo.updateOne({ $pull: { userSavedBlogs: user._id } });
      // Return success message for unbookmark
      return res.status(200).json({
        message: "Blog removed from saved bookmarks",
      });
    } else {
      // If it is not saved, add it to bookmarks
      await userMongo.updateOne({ $push: { blogsSaved: _id } });
      await blogMongo.updateOne({ $push: { userSavedBlogs: user._id } });
      // Return success message for bookmark
      return res.status(200).json({
        message: "Blog saved successfully",
      });
    }
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports.toggleLikes = async (req, res) => {
  // Toggle Bookmark: Save or Remove Blog
  try {
    const user = req.user;
    const { _id } = req.body; // Blog ID from request body

    const userMongo = await User.findById(user._id);
    const blogMongo = await Blog.findById(_id);
    // Check if the blog is already saved
    if (userMongo.likes.includes(_id)) {
      // If it is already saved, remove it (unbookmark)
      await userMongo.updateOne({ $pull: { likes: _id } });
      await blogMongo.updateOne({ $pull: { userLikesBlogs: user._id } });
      // Return success message for unbookmark
      return res.status(200).json({
        message: "User is unliked",
      });
    } else {
      // If it is not saved, add it to bookmarks
      await userMongo.updateOne({ $push: { likes: _id } });
      await blogMongo.updateOne({ $push: { userLikesBlogs: user._id } });
      // Return success message for bookmark
      return res.status(200).json({
        message: "User liked successfully",
      });
    }
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: err.message });
  }
};
