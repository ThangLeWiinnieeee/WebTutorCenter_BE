const mongoose = require("mongoose");

// Đánh giá gia sư của người đăng bài sau khi lớp đã hoàn thành (cả hai phía xác nhận).
// Mỗi lớp đã hoàn thành chỉ được người đăng đánh giá MỘT lần (kiểm tra ở service layer).
const reviewSchema = new mongoose.Schema(
  {
    // Gia sư được đánh giá (đơn nhận lớp đã được duyệt của lớp này)
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor",
      required: [true, "tutorId là bắt buộc"],
      index: true,
    },
    // Lớp (bài đăng) đã hoàn thành mà đánh giá này gắn với
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "classId là bắt buộc"],
      index: true,
    },
    // Người đăng bài (người tạo lớp) — người viết đánh giá
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "reviewerId là bắt buộc"],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Số sao đánh giá là bắt buộc"],
      min: [1, "Số sao tối thiểu là 1"],
      max: [5, "Số sao tối đa là 5"],
    },
    comment: {
      type: String,
      required: [true, "Nội dung nhận xét là bắt buộc"],
      trim: true,
      minlength: [5, "Nhận xét phải có ít nhất 5 ký tự"],
      maxlength: [1000, "Nhận xét không được vượt quá 1000 ký tự"],
    },
    // Xóa mềm: đưa đánh giá vào thùng rác (ẩn khỏi mọi thống kê/hiển thị) thay vì xóa hẳn
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Truy vấn danh sách đánh giá của một gia sư (sắp xếp mới nhất) thường lọc theo trạng thái xóa mềm
reviewSchema.index({ tutorId: 1, deletedAt: 1, createdAt: -1 });
// Tra cứu nhanh "lớp này người đăng đã đánh giá chưa"
reviewSchema.index({ classId: 1, reviewerId: 1 });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
