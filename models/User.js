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
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
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
  verified: {
    type: Boolean,
    default: false,
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

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// static method to login user
userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });

  if (!user) {
    throw Error("incorrect email");
  }
  if (user.verified === false) {
    throw Error("Please verify your email");
  }
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    console.log(auth);
    console.log(password);
    console.log(user.password);
    if (auth) {
      return user;
    }
    throw Error("incorrect password");
  }
  throw Error("incorrect email");
};

userSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    try {
      // Xóa các blog do người dùng tạo
      await Blog.deleteMany({ user: this._id });

      // Xóa người dùng khỏi danh sách blog đã lưu hoặc đã thích
      await Blog.updateMany(
        { userSavedBlogs: this._id },
        { $pull: { userSavedBlogs: this._id } }
      );
      await Blog.updateMany(
        { userLikesBlogs: this._id },
        { $pull: { userLikesBlogs: this._id } }
      );

      next();
    } catch (error) {
      next(error);
    }
  }
);

const User = mongoose.model("user", userSchema);

module.exports = User;
