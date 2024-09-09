const appRootPath = require("app-root-path");
const multer = require("multer");

// Store DiskStorage
const storage = multer.diskStorage({
  filename: (req, file, callback) => {
    // Xác định cách tệp tải lên sẽ được đặt tên
    callback(null, Date.now() + "-" + file.originalname);
  },
});
// limits
const maxSize = 1 * 1024 * 1024;

// validate file
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("chi co anh thoi"));
    }
  },
  // limits: { fileSize: maxSize },
});

// error handling

module.exports = upload;
