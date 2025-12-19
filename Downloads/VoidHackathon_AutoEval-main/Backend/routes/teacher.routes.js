import express from "express";
import multer from "multer";
import { createAssignment, getAssignments, publishAssignment } from "../controllers/teacher.controller.js";

const router = express.Router();

// file upload middleware
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Routes
router.get("/assignments", getAssignments);          // GET /api/teacher/assignments
router.post("/create-assignment", upload.single("answerKey"), createAssignment); // POST /api/teacher/create-assignment
router.post("/publish/:id", publishAssignment);      // POST /api/teacher/publish/:id

export default router;
