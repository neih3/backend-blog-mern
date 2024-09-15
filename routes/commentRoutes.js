const { Router } = require("express");
const commentController = require("../controllers/commentController");
const { isAuth } = require("../middleware/authMiddleware");
const router = Router();

// router.get("/genres", blogController.getBlogsByGenre);

router.post("/", isAuth, commentController.addAComment);

router.get("/:id", isAuth, commentController.getAllCommentsByBlogId);

// router.get("/:id", blogController.getABlog);

router.put("/:id", isAuth, commentController.updateComment);

router.delete("/:id", commentController.deleteComment);

// router.post(
//   "/upload-image",
//   upload.single("image"),
//   blogController.uploadImage
// );

module.exports = router;
