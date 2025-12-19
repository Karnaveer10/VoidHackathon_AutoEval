import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import { evaluateAI } from "../utils/aiEvaluator.js";

export const getAssignmentsForStudent = async (_, res) => {
  const data = await Assignment.find();
  res.json(data);
};

export const submitAssignment = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);

  const isLate = new Date() > new Date(assignment.deadline);

  const submission = await Submission.create({
    assignment: assignment._id,
    student: req.user.id,
    filePath: req.file.path,
    submittedAt: new Date(),
    isLate
  });

  const ai = await evaluateAI();

  submission.status = "evaluated";
  submission.marks = ai.marks;
  submission.feedback = ai.feedback;
  await submission.save();

  res.json(submission);
};

export const getMySubmissions = async (req, res) => {
  const data = await Submission.find({ student: req.user.id })
    .populate("assignment");
  res.json(data);
};
