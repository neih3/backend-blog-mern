const { Router } = require("express");
const authController = require("../controllers/authController");
const { isAuth, isAuthAdmin } = require("../middleware/authMiddleware");
const router = Router();

router.post("/signup", authController.signup_post);
router.get("/signup/:token", authController.verified_user);
router.post("/login", authController.login_post);
router.post("/password-reset", authController.forget_password);
router.post("/password-reset/:token", authController.verified_password);
router.post("/refresh-token", authController.refreshToken);
router.get("/getUser", isAuth, authController.getUser);
router.put("/update-user", isAuth, authController.updateUser);
router.put("/saveBlog", isAuth, authController.toggleBlog);
router.put("/likeBlog", isAuth, authController.toggleLikes);
router.get(
  "/admin/getAllUsers",
  isAuth,
  isAuthAdmin,
  authController.getAllUsers
);
router.delete(
  "/admin/deleteUser/:id",
  isAuth,
  isAuthAdmin,
  authController.deleteUser
);
module.exports = router;
