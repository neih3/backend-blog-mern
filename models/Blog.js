const mongoose = require("mongoose");
const User = require("./User");
const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },

    genres: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    userSavedBlogs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    userLikesBlogs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  { timestamps: true }
);

let Blog = mongoose.model("blog", blogSchema);
module.exports = Blog;
