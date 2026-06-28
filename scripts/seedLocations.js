/**
 * Seed script: tải dữ liệu tỉnh/thành + quận/huyện từ provinces.open-api.vn
 * và upsert vào MongoDB.
 *
 * Chạy: node scripts/seedLocations.js
 * Yêu cầu: file .env có MONGODB_URI
 */

require("dotenv").config();
const mongoose = require("mongoose");
const locationRepository = require("../src/repositories/location.repository");

const API_URL = "https://provinces.open-api.vn/api/v1/?depth=2";

async function fetchData() {
  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error(`API trả về status ${res.status}`);
  }
  return await res.json();
}

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected.");

  console.log(`Fetching data from ${API_URL}...`);
  const data = await fetchData();
  console.log(`Fetched ${data.length} provinces.`);

  const provinces = [];
  const districts = [];

  for (const p of data) {
    provinces.push({
      code: p.code,
      name: p.name,
      codename: p.codename || null,
      divisionType: p.division_type || null,
      phoneCode: p.phone_code || null,
    });

    if (p.districts && Array.isArray(p.districts)) {
      for (const d of p.districts) {
        districts.push({
          code: d.code,
          name: d.name,
          codename: d.codename || null,
          divisionType: d.division_type || null,
          provinceCode: p.code,
        });
      }
    }
  }

  console.log(`Upserting ${provinces.length} provinces...`);
  const provResult = await locationRepository.bulkUpsertProvinces(provinces);
  console.log(
    `  Inserted: ${provResult.upsertedCount}, Modified: ${provResult.modifiedCount}`
  );

  console.log(`Upserting ${districts.length} districts...`);
  const distResult = await locationRepository.bulkUpsertDistricts(districts);
  console.log(
    `  Inserted: ${distResult.upsertedCount}, Modified: ${distResult.modifiedCount}`
  );

  console.log("Seed completed successfully!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
