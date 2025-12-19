import Assignment from "../models/Assignment.js";

export const createAssignment = async (req, res) => {
  try {
    const { title, subject, startDate, deadline, rubric, latePenalty } = req.body;
    const answerKey = req.file ? req.file.path : null;

    const assignment = await Assignment.create({
      title,
      subject,
      startDate,
      deadline,
      rubric,
      latePenalty,
      answerKey,
    });

    res.status(201).json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create assignment" });
  }
};

export const getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find();
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch assignments" });
  }
};

export const publishAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { published: true },
      { new: true }
    );
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: "Failed to publish assignment" });
  }
};
