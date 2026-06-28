const mongoose = require("mongoose");

// Môn học — nguồn dữ liệu duy nhất, do admin quản lý (thay cho danh sách fix cứng).
// `name` chính là chuỗi được lưu trên tutor.subjects và class.subject (vd "Toán").
const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên môn học là bắt buộc"],
      trim: true,
      minlength: [1, "Tên môn học không được rỗng"],
      maxlength: [100, "Tên môn học không được vượt quá 100 ký tự"],
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Trả `id` thay cho `_id` để FE dùng nhất quán với các entity admin khác.
subjectSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

const Subject = mongoose.model("Subject", subjectSchema);

module.exports = Subject;
