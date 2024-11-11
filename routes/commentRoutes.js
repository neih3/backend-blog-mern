const { Router } = require("express");
const commentController = require("../controllers/commentController");
const { isAuth } = require("../middleware/authMiddleware");
const router = Router();

router.post("/", isAuth, commentController.addAComment);

router.get("/:id", isAuth, commentController.getAllCommentsByBlogId);

router.put("/:id", isAuth, commentController.updateComment);

router.delete("/:id", commentController.deleteComment);

module.exports = router;
