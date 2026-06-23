/**
 * Seed script: tạo dữ liệu lớp mới mẫu.
 *
 * Chạy: node scripts/seedClasses.js
 * Yêu cầu:
 * - Có MONGODB_URI trong file .env
 * - Đã seed locations trước (province/district)
 * - Có ít nhất 1 user để gán createdBy
 */

require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../src/models/user.model");
const locationRepository = require("../src/repositories/location.repository");
const classService = require("../src/services/class.service");
const { SUBJECTS } = require("../src/constants/tutor");

const SAMPLE_TOPICS = [
  "Củng cố kiến thức nền",
  "Luyện đề và chữa bài",
  "Ôn tập học kỳ",
  "Nâng cao kỹ năng làm bài",
  "Học bám sát chương trình",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const STUDENT_GENDERS = ["male", "female", "other"];
const TUTOR_LEVEL_PREFS = ["any", "student", "teacher"];
const TUTOR_GENDER_PREFS = ["any", "male", "female"];

const rand = (max) => Math.floor(Math.random() * max);
const pick = (list) => list[rand(list.length)];

const buildAvailabilitySlots = () => {
  const used = new Set();
  const slotCount = 2 + rand(2);
  const slots = [];

  while (slots.length < slotCount) {
    const day = pick(DAYS);
    const hour = 17 + rand(5);
    const key = `${day}-${hour}`;
    if (used.has(key)) continue;
    used.add(key);
    slots.push({ day, hour });
  }
  return slots;
};

const buildPayload = (subject, province, district, index) => {
  const summary = `${subject} - ${pick(SAMPLE_TOPICS)}`;
  const description = `Lớp ${subject} cần gia sư hỗ trợ học viên theo mục tiêu cụ thể. Ưu tiên gia sư có phương pháp rõ ràng, theo sát tiến độ và hỗ trợ chữa bài định kỳ.`;

  return {
    contactPhone: `09${String(10000000 + rand(89999999)).slice(0, 8)}`,
    summary,
    description,
    subject,
    studentGender: pick(STUDENT_GENDERS),
    studentCount: 1 + rand(4),
    startDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
    minutesPerSession: [60, 90, 120][rand(3)],
    sessionsPerWeek: 2 + rand(3),
    provinceCode: province.code,
    districtCode: district.code,
    locationLabel: `${district.name}, ${province.name}`,
    availabilitySlots: buildAvailabilitySlots(),
    tutorGenderPref: pick(TUTOR_GENDER_PREFS),
    tutorLevelPref: pick(TUTOR_LEVEL_PREFS),
    promoCode: null,
  };
};

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected.");

  const users = await User.find({ isActive: true }).select("_id email").limit(5).lean();
  if (users.length === 0) {
    throw new Error("Không có user nào để seed lớp. Hãy tạo user trước.");
  }

  const provinces = await locationRepository.findAllProvinces();
  if (provinces.length === 0) {
    throw new Error("Chưa có dữ liệu tỉnh/thành. Hãy chạy seedLocations trước.");
  }

  const targetSubjects = SUBJECTS.filter(Boolean).slice(0, 120);
  let createdCount = 0;

  for (let i = 0; i < targetSubjects.length; i += 1) {
    const subject = targetSubjects[i];
    const province = pick(provinces);
    const districts = await locationRepository.findDistrictsByProvinceCode(province.code);
    if (districts.length === 0) continue;

    const district = pick(districts);
    const user = users[i % users.length];
    const payload = buildPayload(subject, province, district, i);

    await classService.createClass(payload, user._id);
    createdCount += 1;
  }

  console.log(`Seed lớp hoàn tất. Đã tạo ${createdCount} lớp mẫu.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed classes failed:", err);
  process.exit(1);
});
