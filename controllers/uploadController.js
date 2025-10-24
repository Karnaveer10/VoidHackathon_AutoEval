const { uploadOnCloudinary } = require("../utils/cloudinary");
const Guide = require("../models/guideModel");
const fs = require("fs");
const path = require("path");
const { getIo } = require("../utils/Socket.js");

const uploadFiles = async (req, res) => {
    try {
        const io = getIo();
        const { type } = req.body; // submission stage
        const { regno } = req.user; // student's regNo

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No files uploaded" });
        }

        const uploadedFiles = [];
        for (const file of req.files) {
            const normalizedPath = path.resolve(file.path);
            const uploaded = await uploadOnCloudinary(normalizedPath, { resource_type: "raw" });
            if (!uploaded || !uploaded.secure_url) continue;

            uploadedFiles.push({
                fileUrl: uploaded.secure_url,
                fileName: file.originalname
            });

            if (fs.existsSync(normalizedPath)) fs.unlinkSync(normalizedPath);
        }

        // 1️⃣ Get the guide doc first to check remarks
        const guideDoc = await Guide.findOne({ "acceptedTeams.members.regNo": regno });
        if (!guideDoc) return res.status(404).json({ message: "Team not found" });

        // 2️⃣ Find the correct team and submission
        const team = guideDoc.acceptedTeams.find(t => t.members.some(m => m.regNo === regno));
        if (!team) return res.status(404).json({ message: "Team not found for this student" });

        const submission = team.submissions.find(s => s.type === type);
        if (!submission) return res.status(404).json({ message: "Submission stage not found" });

        // 3️⃣ Decide message based on existing remarks
        const message = submission.remarks && submission.remarks.trim() !== ""
            ? `Student resubmitted ${type}`
            : `Student submitted ${type}`;

        // 4️⃣ Update submission
        submission.files.push(...uploadedFiles);
        submission.status = "submitted";

        await guideDoc.save();

        // 5️⃣ Emit message to guide
        io.to(guideDoc.pid).emit("submissionupdateGuide", {
            message,
            teamId: team._id,
            submissionType: type,
            studentRegNo: regno
        });

        res.status(200).json({
            message: "Files uploaded successfully",
            files: uploadedFiles
        });

    } catch (err) {
        console.error("Server error in uploadFiles:", err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { uploadFiles };
