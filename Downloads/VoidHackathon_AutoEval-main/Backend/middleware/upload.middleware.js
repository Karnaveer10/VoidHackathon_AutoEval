import multer from "multer";
import path from "path";

const storage = (folder) => multer.diskStorage({
  destination: `uploads/${folder}`,
  filename: (_, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

export const uploadAnswerKey = multer({ storage: storage("answerKeys") });
export const uploadSubmission = multer({ storage: storage("studentSubmissions") });
