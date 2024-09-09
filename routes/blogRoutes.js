const { Router } = require("express");
const blogController = require("../controllers/blogController");
const upload = require("../multer");
const { isAuth } = require("../middleware/authMiddleware");
const router = Router();

router.get("/genres", blogController.getBlogsByGenre);

router.post("/", blogController.addABlog);

router.get("/", blogController.getAllBlogs);

router.get("/:id", blogController.getABlog);

router.put("/:id", isAuth, blogController.updateBlog);

router.delete("/:id", blogController.deleteBlog);

router.post(
  "/upload-image",
  upload.single("image"),
  blogController.uploadImage
);

module.exports = router;
