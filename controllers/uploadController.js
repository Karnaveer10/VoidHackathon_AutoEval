const { uploadOnCloudinary } = require("../utils/cloudinary");
const Guide = require("../models/guideModel");

const uploadFile = async (req, res) => {
    try {
        const localFilePath = req.file?.path;
        if (!localFilePath) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Upload file to Cloudinary
        const uploadedFile = await uploadOnCloudinary(localFilePath);
        if (!uploadedFile) {
            return res.status(500).json({ message: "Cloudinary upload failed" });
        }

        const { type } = req.body;
        if (!type || !["abstract", "review1", "review2", "final"].includes(type)) {
            return res.status(400).json({ message: "Invalid submission type" });
        }

        // Build the submission object
        const submissionObj = {
            type,
            fileUrl: uploadedFile.secure_url,
        };

        // Get regno from req.user
        const { regno } = req.user;

        // Find the user's team and push the submission
        const guideDoc = await Guide.findOneAndUpdate(
            { "acceptedTeams.members.regNo": regno },
            { $push: { "acceptedTeams.$.submissions": submissionObj } },
            { new: true }
        );

        if (!guideDoc) {
            return res.status(404).json({ message: "Guide or team not found" });
        }

        return res.status(200).json({
            message: "File uploaded successfully",
            submission: submissionObj,
         
        });
    } catch (err) {
        console.error("Upload error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { uploadFile };
