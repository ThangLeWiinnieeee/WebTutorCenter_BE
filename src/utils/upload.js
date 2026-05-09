const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../configs/cloudinary");
const AppError = require("./AppError");

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: "webtutorcenter/avatars",
    public_id: `avatar_${req.user.id}_${Date.now()}`,
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      { width: 500, height: 500, crop: "limit" },
      { quality: "auto", fetch_format: "auto" },
    ],
  }),
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Chỉ hỗ trợ file ảnh (JPG, PNG, GIF, WEBP)", 400), false);
  }
};

const uploadAvatarMiddleware = multer({
  storage: avatarStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single("avatar");

const deleteAvatarFromCloudinary = async (avatarUrl) => {
  if (!avatarUrl || !avatarUrl.includes("cloudinary.com")) return;

  try {
    // URL dạng: https://res.cloudinary.com/<cloud>/image/upload/v123/webtutorcenter/avatars/avatar_xxx.jpg
    const match = avatarUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
    if (!match) return;
    const publicId = match[1];
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Delete Cloudinary avatar failed:", err.message);
  }
};

module.exports = { uploadAvatarMiddleware, deleteAvatarFromCloudinary };
