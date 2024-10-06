const Blog = require("../models/Blog");
const User = require("../models/User");
const Comment = require("../models/Comment");
const cloudinary = require("../cloudinary");
const upload = require("../multer");
const fs = require("fs");
const path = require("path");
const blogController = {
  //ADD A Blog
  addABlog: async (req, res) => {
    try {
      const newBlog = new Blog(req.body);
      const savedBlog = await newBlog.save();
      if (req.body.user) {
        const user = User.findById(req.body.user);
        await user.updateOne({ $push: { blogs: savedBlog._id } });
      }
      res.status(200).json(savedBlog);
    } catch (err) {
      res.status(500).json(err);
    }
  },
  //GET ALL BLOGS
  getAllBlogs: async (req, res) => {
    try {
      const allBlogs = await Blog.find().populate({
        path: "user",
        model: User,
      });
      res.status(200).json(allBlogs);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  //GET A Blog
  getABlog: async (req, res) => {
    try {
      //   chú ý populate kiểu này
      const blog = await Blog.findById(req.params.id)
        .populate({
          path: "user",
          model: User,
        })
        .populate({
          path: "comments",
          model: Comment,
          populate: {
            path: "user",
            model: User,
            select: "name avatar",
          },
        });
      res.status(200).json(blog);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  //UPDATE Blog
  updateBlog: async (req, res) => {
    try {
      const blog = await Blog.findById(req.params.id);
      await blog.updateOne({ $set: req.body });
      res.status(200).json("Updated successfully!");
    } catch (err) {
      res.status(500).json(err);
    }
  },

  //DELETE BLOG
  deleteBlog: async (req, res) => {
    try {
      await User.updateMany(
        { blogs: req.params.id },
        { $pull: { blogs: req.params.id } }
      );
      await Blog.findByIdAndDelete(req.params.id);
      res.status(200).json("Deleted successfully");
    } catch (err) {
      res.status(500).json(err);
    }
  },

  getBlogsByGenre: async (req, res) => {
    try {
      const genre = req.query.genre; // Lấy thể loại từ query string
      const blogs = await Blog.find({ genres: genre }).populate({
        path: "user",
        model: User,
      });
      res.status(200).json(blogs);
    } catch (error) {
      res.status(500).json(error);
    }
  },

  uploadImage: async (req, res) => {
    try {
      const uploader = async (path) => await cloudinary.uploads(path, "Images");
      const urls = [];
      const { path } = req.file;

      const newPath = await uploader(path);
      urls.push(newPath);

      res.status(200).json({
        message: "uploaded suc",
        data: newPath,
      });
    } catch (error) {
      console.log(error);
    }
  },
  getBookMarks: async (req, res) => {
    const { _id } = req.user;
    try {
      const blog = await Blog.find({ userSavedBlogs: _id }).populate({
        path: "user",
        model: User,
      });
      res.status(200).json(blog);
    } catch (error) {
      res.status(500).json(error);
    }
  },
  searchBlogs: async (req, res) => {
    const { limit, q, page } = req.query;
    try {
      const blog = await Blog.find({
        $text: { $search: q },
      })
        .populate({
          path: "user",
          model: User,
        })
        .skip((page - 1) * limit)
        .limit(limit);

      res.status(200).json(blog);
    } catch (error) {
      res.status(500).json(error);
    }
  },
};

module.exports = blogController;
