const mongoose = require("mongoose");

// Mức độ quan tâm của học viên theo "môn|tỉnh" để xếp hạng trang /tutors. Mỗi học viên 1 document.
// - contexts: khóa "môn|tỉnh" (một vế có thể rỗng) → { s: điểm, t: mốc cập nhật ms }. Xem LEARNER_AFFINITY.
// - countedClassIds: lớp đã cộng điểm → đăng rồi chọn gia sư cùng một lớp chỉ tính 1 lần.
const learnerAffinitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    contexts: {
      type: Map,
      of: new mongoose.Schema({ s: Number, t: Number }, { _id: false }),
      default: {},
    },
    countedClassIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LearnerAffinity", learnerAffinitySchema);
