const multer = require("multer");

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // folder to store files
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // keep original name
  },
});

// Multer instance for multiple files (max 10)
const upload = multer({ storage }).array("files", 10);

module.exports = { upload };
