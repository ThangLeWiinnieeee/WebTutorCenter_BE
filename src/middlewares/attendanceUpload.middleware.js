const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../configs/cloudinary");
const AppError = require("../utils/AppError");
const HTTP_STATUS = require("../constants/status");

const attendanceStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, _file) => ({
    folder: "webtutorcenter/attendance",
    public_id: `att_${req.user?.id || "anon"}_${Date.now()}`,
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 1600, height: 1600, crop: "limit" },
      { quality: "auto", fetch_format: "auto" },
    ],
  }),
});

const attendanceFileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Chỉ hỗ trợ file ảnh định dạng JPG, PNG hoặc WEBP",
        HTTP_STATUS.BAD_REQUEST
      ),
      false
    );
  }
};

const uploader = multer({
  storage: attendanceStorage,
  fileFilter: attendanceFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB theo P7
}).single("photo");

const uploadAttendancePhotoMiddleware = (req, res, next) => {
  uploader(req, res, (err) => {
    if (err) {
      if (err instanceof AppError) return next(err);
      const msg =
        err.code === "LIMIT_FILE_SIZE"
          ? "Ảnh điểm danh không được vượt quá 10MB"
          : "Tải ảnh điểm danh thất bại, vui lòng thử lại";
      return next(new AppError(msg, HTTP_STATUS.BAD_REQUEST));
    }
    return next();
  });
};

module.exports = { uploadAttendancePhotoMiddleware };
