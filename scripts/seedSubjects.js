/**
 * Seed script: danh mục môn học (Subject) trong DB.
 *
 * Chạy: node scripts/seedSubjects.js
 * Yêu cầu: file .env có MONGODB_URI
 *
 * Idempotent: upsert theo `name`, không xóa môn đã có (giữ dữ liệu admin thêm tay).
 * Nguồn ban đầu lấy từ constants/subject.js — đúng danh sách mà tutor/class hiện đang dùng,
 * đảm bảo dữ liệu cũ vẫn hợp lệ sau khi chuyển sang validate theo DB.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Subject = require("../src/models/subject.model");
const SUBJECTS = require("../src/constants/subject");

const seedSubjects = async () => {
  try {
    console.log("🌱 Seeding subjects...");

    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/webtutorcenter");
    console.log("✓ Connected to MongoDB");

    let created = 0;
    let skipped = 0;
    for (let i = 0; i < SUBJECTS.length; i++) {
      const name = SUBJECTS[i];
      // Khớp tên không phân biệt hoa/thường để tránh tạo trùng.
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const existing = await Subject.findOne({ name: { $regex: `^${escaped}$`, $options: "i" } });
      if (existing) {
        skipped++;
        continue;
      }
      await Subject.create({ name, order: i + 1, isActive: true });
      created++;
    }

    console.log(`✓ Created ${created} subjects, skipped ${skipped} (đã tồn tại)`);

    await mongoose.disconnect();
    console.log("✅ Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

seedSubjects();
