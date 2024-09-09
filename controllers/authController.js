const { generateToken, verifyToken } = require("../helpers/jwt.helpers");
const User = require("../models/User");
const Blog = require("../models/Blog");

module.exports.refreshToken = async (req, res) => {
  const refreshTokenFromClient = req.body.refresh_token;
  if (!refreshTokenFromClient) {
    return res.status(403).json({
      message: "No refresh token provided.",
    });
  }

  try {
    // Verify and decode the refresh token

    const decoded = await verifyToken(refreshTokenFromClient, "hien");
    const { email } = decoded.data;
    // Find the user with the given email and refresh token
    const user = await User.findOne({
      email,
      refreshToken: refreshTokenFromClient,
    });
    if (!user) {
      return res.status(403).json({
        message: "Invalid refresh token.",
      });
    }

    // Generate new access token
    const accessToken = await generateToken({ email }, "hien", "100s");

    // // Generate new refresh token
    // const newRefreshToken = await generateToken({ email }, "hien", "3650d");

    // // Update user's refresh token in the database
    // user.refreshToken = newRefreshToken;
    // await user.save();

    // Send new tokens to the client
    res.status(200).json({
      accessToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(403).json({
      message: "Invalid refresh token.",
    });
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

module.exports.signup_post = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const user = await User.create({ email, password, name });
    const accessToken = await generateToken({ email, name }, "hien", "1h");
    const refreshToken = await generateToken({ email, name }, "hien", "3650d");
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

module.exports.login_post = async (req, res) => {
  const { email, password, name, avatar } = req.body;

  try {
    const user = await User.login(email, password);
    const accessToken = await generateToken({ email, name }, "hien", "1000s");
    const refreshToken = await generateToken({ email, name }, "hien", "3650d");
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
