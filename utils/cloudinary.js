const { v2: cloudinary } = require("cloudinary");
const fs = require("fs");
require('dotenv').config();

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload the file on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "raw"
        });

        // Remove local file if it exists
        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);

        return response;
    } catch (error) {
        console.error("Cloudinary upload error:", error);

        // Remove local file if it exists, even on error
        if (localFilePath && fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);

        return null;
    }
};

module.exports = { uploadOnCloudinary };
