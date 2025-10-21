const { v2: cloudinary } = require("cloudinary");
const fs = require("fs");
const path = require("path");
require('dotenv').config();

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath, options = {}) => {
  try {
    if (!localFilePath) return null;

    // Determine resource_type based on file extension
    const ext = path.extname(localFilePath).toLowerCase();
    const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
    const pptExtensions = [".ppt", ".pptx"];
    const txtExtensions = [".txt"];
    const pdfExtensions = [".pdf"];

    let resourceType = "raw"; // default
    if (imageExtensions.includes(ext)) resourceType = "image"; // images
    // raw is fine for pdf, ppt, txt, no need to change

    // Merge minimal options with auto-detected resource_type
    const uploadOptions = {
      resource_type: resourceType,
      type: "upload", // public
      ...options
    };

    // Upload file
    const response = await cloudinary.uploader.upload(localFilePath, uploadOptions);

    // Remove local file
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    console.error("Cloudinary upload error:", error.message);

    if (localFilePath && fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);

    return null;
  }
};

module.exports = { uploadOnCloudinary };
