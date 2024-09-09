const mongoose = require("mongoose");
const User = require("./User");
const Blog = require("./Blog");
const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
      required: true,
    },
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
    },
  },
  { timestamps: true }
);

let Comment = mongoose.model("comment", commentSchema);
module.exports = Comment;
