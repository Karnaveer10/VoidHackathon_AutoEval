const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
require("dotenv").config();
const Guide = require("../models/guideModel");
mongoose.connect(process.env.DB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL, // your Gmail address
    pass: process.env.APP_PASSWORD, // 16-digit app password
  },
});

//Helper: Validate email properly (no spaces, must contain "@")
function isValidEmail(email) {
  return typeof email === "string" && email.includes("@") && !email.includes(" ");
}

//Helper: send email
async function sendReminder(guideEmail, guideName, submissionType) {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: guideEmail,
    subject: `⚠️ Reminder: ${submissionType} pending for more than 48 hours`,
    text: `Hello ${guideName},

This is an automated reminder that ${submissionType} submission has been pending review for over 48 hours.

Please log in to the Capstone Portal and take the necessary action.

- Capstone Admin`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📩 Email sent to ${guideEmail} for ${submissionType}`);
  } catch (error) {
    console.error(`❌ Error sending email to ${guideEmail}:`, error.message);
  }
}

//Main function
async function checkSubmissions() {
  try {
    const guides = await Guide.find();
    const now = new Date();
    const cutoff = 48 * 60 * 60 * 1000; // 48 hours in ms (for testing keep 1 min)

    for (const guide of guides) {
      // Skip invalid or missing emails
      if (!isValidEmail(guide.email)) {
        console.log(`⚠️ Skipping guide ${guide.name}, invalid email.`);
        continue;
      }

      for (const team of guide.acceptedTeams || []) {
        for (const submission of team.submissions || []) {
          if (submission.status === "submitted" || submission.status === "pending") {
            for (const file of submission.files || []) {
              if (!file.uploadedAt) continue;

              const uploadedAt = new Date(file.uploadedAt);
              const diff = now - uploadedAt;

              if (diff > cutoff) {
                await sendReminder(guide.email, guide.name, submission.type);
              }
            }
          }
        }
      }
    }

    console.log("✅ SLA check complete");
  } catch (err) {
    console.error("❌ Error checking submissions:", err.message);
  }
}

//Run script directly
if (require.main === module) {
  checkSubmissions();
}

//Export for external use (optional)
module.exports = { checkSubmissions };
