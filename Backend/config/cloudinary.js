import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 1. Profile Photo Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "codesync_profiles",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [{ width: 400, height: 400, crop: "limit" }],
  },
});

// 2. Question Image Storage
const questionStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "codesync_questions",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [{ width: 1000, crop: "limit" }], // Questions ki image thodi badi ho sakti hai
  },
});

export const upload = multer({ storage: storage });
export const uploadQuestion = multer({ storage: questionStorage });
export default cloudinary;
