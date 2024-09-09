const { Router } = require("express");
const authController = require("../controllers/authController");
const { isAuth } = require("../middleware/authMiddleware");
const router = Router();

router.post("/signup", authController.signup_post);
router.post("/login", authController.login_post);
router.post("/refresh-token", authController.refreshToken);
router.get("/getUser", isAuth, authController.getUser);
router.put("/update-user", isAuth, authController.updateUser);
router.put("/saveBlog", isAuth, authController.toggleBlog);
router.put("/likeBlog", isAuth, authController.toggleLikes);
module.exports = router;
