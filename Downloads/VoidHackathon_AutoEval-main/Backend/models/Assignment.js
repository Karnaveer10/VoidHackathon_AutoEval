import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
  title: String,
  subject: String,
  startDate: Date,
  deadline: Date,
  rubric: String,
  latePenalty: Number,
  answerKey: String,
  published: { type: Boolean, default: false },
});

export default mongoose.model("Assignment", assignmentSchema);
