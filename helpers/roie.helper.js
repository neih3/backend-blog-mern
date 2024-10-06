const createError = require("http-errors");

const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(createError(403, "Access denied. You need an Admin role."));
  }
  console.log("là admin");
  next();
};

module.exports = verifyAdmin;
