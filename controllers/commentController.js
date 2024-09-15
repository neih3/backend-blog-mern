const Blog = require("../models/Blog");
const User = require("../models/User");
const Comment = require("../models/Comment");
const cloudinary = require("../cloudinary");
const upload = require("../multer");
const fs = require("fs");
const path = require("path");
const commentController = {
  //ADD A Comment
  addAComment: async (req, res) => {
    try {
      const newComment = new Comment(req.body);
      const savedComment = await newComment.save();
      if (req.body.blog) {
        const blog = Blog.findById(req.body.blog);
        await blog.updateOne({ $push: { comments: savedComment._id } });
      }
      res.status(200).json(savedComment);
    } catch (err) {
      res.status(500).json(err);
    }
  },
  //GET ALL Comment
  getAllCommentsByBlogId: async (req, res) => {
    try {
      // Giả định req.params.id là ID của blog mà bạn muốn tìm các comment thuộc về nó
      console.log(req.params.id);

      // Tìm tất cả các comment có blog ID tương ứng
      const comments = await Comment.find({ blog: req.params.id });

      res.status(200).json(comments);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server error", error: err });
    }
  },

  //UPDATE Comment
  updateComment: async (req, res) => {
    try {
      const { content } = req.body;

      const comment = await Comment.findById(req.params.id);

      // Ensure you only update fields that are provided

      if (content) comment.content = content;

      const updatedComment = await comment.save();

      res.status(200).json({
        mes: "Updated successfully!",
        comment: updatedComment,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },

  // DELETE Comment
  deleteComment: async (req, res) => {
    try {
      // Update the Blog documents by pulling the comment ID from the comments array
      const updatedBlogs = await Blog.updateMany(
        { comments: req.params.id }, // Assuming "comments" is the field that holds the comment references
        { $pull: { comments: req.params.id } }
      );

      // Check if the comment exists before attempting to delete
      const comment = await Comment.findById(req.params.id);
      if (!comment) {
        return res.status(404).json({
          message: "Comment not found!",
        });
      }

      // Delete the comment
      await Comment.findByIdAndDelete(req.params.id);

      res.status(200).json({
        message: "Deleted successfully",
        updatedBlogs,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Error deleting the comment",
        error: err.message,
      });
    }
  },
};

module.exports = commentController;
