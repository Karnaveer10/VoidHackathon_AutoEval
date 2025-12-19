import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment"
  },

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  filePath: String,
  submittedAt: Date,
  isLate: Boolean,

  status: {
    type: String,
    enum: ["evaluating", "evaluated"],
    default: "evaluating"
  },

  marks: Number,
  feedback: String
}, { timestamps: true });

export default mongoose.model("Submission", submissionSchema);
