const { uploadOnCloudinary } = require("../utils/cloudinary");
const Guide = require("../models/guideModel");
const fs = require("fs");
const path = require("path");

const uploadFiles = async (req, res) => {
    try {
        const { type } = req.body; // submission stage
        const { regno } = req.user; // student's regNo
        console.log("Files received from client:", req.files);

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No files uploaded" });
        }

        // Log local file details
        req.files.forEach((file) => {
            const stats = fs.statSync(file.path);
            console.log(`${file.originalname} size on disk:`, stats.size);
            console.log(`${file.originalname} MIME type:`, file.mimetype);
        });

        const uploadedFiles = [];

        for (const file of req.files) {
            // Normalize path for Windows/OS compatibility
            const normalizedPath = path.resolve(file.path);
            console.log("Uploading file:", file.originalname);
            console.log("File path:", normalizedPath);
            console.log("File size:", fs.statSync(normalizedPath).size);
            console.log("MIME type:", file.mimetype);

            // Upload to Cloudinary (use 'raw' for PDFs or any non-image files)
            const uploaded = await uploadOnCloudinary(normalizedPath, { resource_type: "raw" });

            if (!uploaded || !uploaded.secure_url) {
                console.error("Cloudinary upload failed for file:", file.originalname);
                continue; // skip this file
            }

            console.log("Cloudinary response:", uploaded);

            uploadedFiles.push({
                fileUrl: uploaded.secure_url,
                fileName: file.originalname
            });

            // Delete local temp file
            if (fs.existsSync(normalizedPath)) {
                fs.unlinkSync(normalizedPath);
                console.log("Deleted local temp file:", normalizedPath);
            }
        }

        console.log("All uploaded files:", uploadedFiles);

        // Push uploaded files to the correct submission stage
        const guideDoc = await Guide.findOneAndUpdate(
            { "acceptedTeams.members.regNo": regno },
            {
                $push: {
                    "acceptedTeams.$[team].submissions.$[sub].files": { $each: uploadedFiles }
                },
                $set: {
                    "acceptedTeams.$[team].submissions.$[sub].status": "submitted"
                }
            },
            {
                arrayFilters: [
                    { "team.members.regNo": regno },
                    { "sub.type": type }
                ],
                new: true
            }
        );

        if (!guideDoc) {
            return res.status(404).json({ message: "Team or submission stage not found" });
        }

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
