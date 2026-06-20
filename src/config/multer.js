import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(
      null,
      uniqueName + path.extname(file.originalname)
    );
  },
});


//TODO: CHANGED UPLOAD FOR SECURITY REASONS, ONLY ALLOW IMAGE FILES UNDER 10MB
//const upload = multer({ storage });
const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp"];
const allowedMimeTypes = ["image/png", "image/jpeg", "image/webp"];

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Only image files (png, jpg, jpeg, webp) under 10MB are allowed"));
    }
    cb(null, true);
  },
});
export default upload;