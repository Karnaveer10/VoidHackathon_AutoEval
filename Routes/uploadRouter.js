const express = require("express");
const { upload } = require("../middleware/multer");
const { uploadFile } = require("../controllers/uploadController");
const auth = require("../middleware/auth");

const userRouter = express.Router();

// protect all routes with auth
userRouter.use(auth);

// route for file upload
userRouter.post("/uploadFile", upload.single("file"), uploadFile);

module.exports = userRouter;
