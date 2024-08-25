const { generateToken, verifyToken } = require("../helpers/jwt.helpers");
const User = require("../models/User");

module.exports.refreshToken = async (req, res) => {
  const refreshTokenFromClient = req.body.refreshToken;

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
    const accessToken = await generateToken({ email }, "hien", "1h");

    // Generate new refresh token
    const newRefreshToken = await generateToken({ email }, "hien", "3650d");

    // Update user's refresh token in the database
    user.refreshToken = newRefreshToken;
    await user.save();

    // Send new tokens to the client
    res.status(200).json({
      accessToken,
      refreshToken: newRefreshToken,
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
  const { email, password } = req.body;

  try {
    const user = await User.create({ email, password });
    const accessToken = await generateToken({ email, password }, "hien", "1h");
    const refreshToken = await generateToken(
      { email, password },
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

module.exports.login_post = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);
    const accessToken = await generateToken({ email, password }, "hien", "1h");
    const refreshToken = await generateToken(
      { email, password },
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
