const mongoose = require("mongoose");
const { isEmail, isUppercase } = require("validator");
const Blog = require("./Blog");
const bcrypt = require("bcryptjs");
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: [true, "Please enter name"],
    isUppercase: true,
  },
  avatar: {
    type: String,
  },
  bio: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Please enter an email"],
    lowercase: true,
    validate: [isEmail, "Please enter a valid Email"],
  },
  password: {
    type: String,
    required: [true, "please enter an password"],
    minlength: [6, "Minimum password length is 6 cha"],
  },
  refreshToken: {
    type: String,
  },
  blogs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
    },
  ],
  blogsSaved: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
    },
  ],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
    },
  ],
});

// fire a func after doc saved to db
// userSchema.post("save", function (doc, next) {
//   console.log("new user was created ", doc);
//   next();
// });

// fire a func before doc saved to db
userSchema.pre("save", async function (next) {
  // console.log(this);
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// static method to login user
userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });

  if (user) {
    const auth = bcrypt.compare(password, user.password);
    if (auth) {
      return user;
    }
    throw Error("incorrect password");
  }
  throw Error("incorrect email");
};

const User = mongoose.model("user", userSchema);

module.exports = User;
