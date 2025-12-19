import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { uploadSubmission } from "../middleware/upload.middleware.js";
import {
  getAssignmentsForStudent,
  submitAssignment,
  getMySubmissions
} from "../controllers/student.controller.js";

const router = express.Router();

router.get("/assignments", protect, allowRoles("student"), getAssignmentsForStudent);
router.post(
  "/submit/:id",
  protect,
  allowRoles("student"),
  uploadSubmission.single("file"),
  submitAssignment
);
router.get("/submissions", protect, allowRoles("student"), getMySubmissions);

export default router;
