/**
 * Seed script: cấu hình học phí lớp mới (ClassPricingConfig).
 *
 * Chạy: node scripts/seedClassPricing.js
 * Hoặc: npm run seed:pricing
 * Yêu cầu: file .env có MONGODB_URI
 */

require("dotenv").config();
const mongoose = require("mongoose");
const classPricingRepository = require("../src/repositories/class.pricing.repository");

const SEED_DATA = {
  defaultBaseFee: 150000,
  studentCountSurcharge: 15000,
  sessionLengthBaseMinutes: 90,
  minutesPerSessionOptions: [60, 90, 120, 150, 180],
  sessionsPerWeekMin: 1,
  sessionsPerWeekMax: 7,
  baseFeeBySubject: [
    { subject: "Toán", fee: 150000 },
    { subject: "Ngữ văn", fee: 140000 },
    { subject: "Tiếng Anh", fee: 170000 },
    { subject: "Vật lý", fee: 160000 },
    { subject: "Hóa học", fee: 160000 },
    { subject: "Sinh học", fee: 150000 },
    { subject: "Lịch sử", fee: 130000 },
    { subject: "Địa lý", fee: 130000 },
    { subject: "Tin học", fee: 180000 },
  ],
};

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected.");

  const saved = await classPricingRepository.upsertDefault(SEED_DATA);
  console.log("Upserted ClassPricingConfig:", {
    configKey: saved.configKey,
    defaultBaseFee: saved.defaultBaseFee,
    minutesPerSessionOptions: saved.minutesPerSessionOptions,
    subjectCount: saved.baseFeeBySubject?.length ?? 0,
  });

  console.log("Seed completed successfully!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
