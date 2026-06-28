/**
 * Seed dữ liệu trường đại học, cao đẳng, học viện tại Việt Nam.
 *
 * Chạy: npm run seed:schools
 * Yêu cầu: file .env có MONGODB_URI
 */

require("dotenv").config();
const mongoose = require("mongoose");
const locationRepository = require("../src/repositories/location.repository");

const SCHOOLS = [
  // ─── ĐẠI HỌC QUỐC GIA & VÙNG ───
  { name: "Đại học Quốc gia Hà Nội", shortName: "VNU", type: "university", provinceCode: 1 },
  { name: "Đại học Quốc gia TP.HCM", shortName: "VNU-HCM", type: "university", provinceCode: 79 },
  { name: "Đại học Đà Nẵng", shortName: "UD", type: "university", provinceCode: 48 },
  { name: "Đại học Huế", shortName: "DHH", type: "university", provinceCode: 46 },
  { name: "Đại học Thái Nguyên", shortName: "TNU", type: "university", provinceCode: 19 },

  // ─── ĐẠI HỌC KỸ THUẬT & CÔNG NGHỆ ───
  { name: "Đại học Bách khoa Hà Nội", shortName: "HUST", type: "university", provinceCode: 1 },
  { name: "Đại học Bách khoa TP.HCM", shortName: "BK TPHCM", type: "university", provinceCode: 79 },
  { name: "Đại học Bách khoa Đà Nẵng", shortName: "DUT", type: "university", provinceCode: 48 },
  { name: "Đại học Xây dựng Hà Nội", shortName: "HUCE", type: "university", provinceCode: 1 },
  { name: "Đại học Giao thông Vận tải", shortName: "UTC", type: "university", provinceCode: 1 },
  { name: "Đại học Giao thông Vận tải TP.HCM", shortName: "UT-HCMC", type: "university", provinceCode: 79 },
  { name: "Đại học Công nghệ - ĐHQGHN", shortName: "UET", type: "university", provinceCode: 1 },
  { name: "Đại học Công nghệ Thông tin - ĐHQG TPHCM", shortName: "UIT", type: "university", provinceCode: 79 },
  { name: "Đại học Công nghiệp Hà Nội", shortName: "HaUI", type: "university", provinceCode: 1 },
  { name: "Đại học Công nghiệp TP.HCM", shortName: "IUH", type: "university", provinceCode: 79 },
  { name: "Đại học Công nghiệp Thực phẩm TP.HCM", shortName: "HUFI", type: "university", provinceCode: 79 },
  { name: "Đại học Điện lực", shortName: "EPU", type: "university", provinceCode: 1 },
  { name: "Đại học Mỏ - Địa chất", shortName: "HUMG", type: "university", provinceCode: 1 },
  { name: "Đại học Thủy lợi", shortName: "TLU", type: "university", provinceCode: 1 },
  { name: "Đại học Sư phạm Kỹ thuật TP.HCM", shortName: "HCMUTE", type: "university", provinceCode: 79 },
  { name: "Đại học Sư phạm Kỹ thuật Hưng Yên", shortName: "UTEHY", type: "university", provinceCode: 33 },
  { name: "Đại học Sư phạm Kỹ thuật Vinh", shortName: "VUTED", type: "university", provinceCode: 40 },
  { name: "Đại học Phenikaa", shortName: "PU", type: "university", provinceCode: 1 },
  { name: "Đại học FPT", shortName: "FPT", type: "university", provinceCode: 1 },
  { name: "Đại học Lạc Hồng", shortName: "LHU", type: "university", provinceCode: 75 },
  { name: "Đại học Tôn Đức Thắng", shortName: "TDTU", type: "university", provinceCode: 79 },
  { name: "Đại học Duy Tân", shortName: "DTU", type: "university", provinceCode: 48 },

  // ─── ĐẠI HỌC KINH TẾ & QUẢN TRỊ ───
  { name: "Đại học Kinh tế Quốc dân", shortName: "NEU", type: "university", provinceCode: 1 },
  { name: "Đại học Kinh tế TP.HCM", shortName: "UEH", type: "university", provinceCode: 79 },
  { name: "Đại học Kinh tế - ĐHQGHN", shortName: "VNU-UEB", type: "university", provinceCode: 1 },
  { name: "Đại học Kinh tế Đà Nẵng", shortName: "DUE", type: "university", provinceCode: 48 },
  { name: "Đại học Kinh tế - Kỹ thuật Công nghiệp", shortName: "UNETI", type: "university", provinceCode: 1 },
  { name: "Đại học Thương mại", shortName: "TMU", type: "university", provinceCode: 1 },
  { name: "Đại học Ngoại thương", shortName: "FTU", type: "university", provinceCode: 1 },
  { name: "Đại học Ngoại thương cơ sở 2 TP.HCM", shortName: "FTU2", type: "university", provinceCode: 79 },
  { name: "Đại học Ngân hàng TP.HCM", shortName: "BUH", type: "university", provinceCode: 79 },
  { name: "Đại học Tài chính - Marketing", shortName: "UFM", type: "university", provinceCode: 79 },
  { name: "Đại học Tài chính - Ngân hàng Hà Nội", shortName: null, type: "university", provinceCode: 1 },
  { name: "Đại học Lao động - Xã hội", shortName: "ULSA", type: "university", provinceCode: 1 },
  { name: "Đại học RMIT Việt Nam", shortName: "RMIT", type: "university", provinceCode: 79 },

  // ─── ĐẠI HỌC SƯ PHẠM & GIÁO DỤC ───
  { name: "Đại học Sư phạm Hà Nội", shortName: "HNUE", type: "university", provinceCode: 1 },
  { name: "Đại học Sư phạm Hà Nội 2", shortName: "HPU2", type: "university", provinceCode: 26 },
  { name: "Đại học Sư phạm TP.HCM", shortName: "HCMUE", type: "university", provinceCode: 79 },
  { name: "Đại học Sư phạm Đà Nẵng", shortName: "UED", type: "university", provinceCode: 48 },
  { name: "Đại học Giáo dục - ĐHQGHN", shortName: "VNU-UEd", type: "university", provinceCode: 1 },
  { name: "Đại học Sư phạm Thái Nguyên", shortName: "TNUE", type: "university", provinceCode: 19 },
  { name: "Đại học Vinh", shortName: "VinhUni", type: "university", provinceCode: 40 },
  { name: "Đại học Quy Nhơn", shortName: "QNU", type: "university", provinceCode: 52 },
  { name: "Đại học Đồng Tháp", shortName: "DTHU", type: "university", provinceCode: 87 },

  // ─── ĐẠI HỌC KHOA HỌC TỰ NHIÊN & XÃ HỘI ───
  { name: "Đại học Khoa học Tự nhiên - ĐHQGHN", shortName: "HUS", type: "university", provinceCode: 1 },
  { name: "Đại học Khoa học Tự nhiên - ĐHQG TPHCM", shortName: "HCMUS", type: "university", provinceCode: 79 },
  { name: "Đại học Khoa học Xã hội và Nhân văn - ĐHQGHN", shortName: "USSH", type: "university", provinceCode: 1 },
  { name: "Đại học Khoa học Xã hội và Nhân văn - ĐHQG TPHCM", shortName: "HCMUSSH", type: "university", provinceCode: 79 },
  { name: "Đại học Khoa học Huế", shortName: "HUSC", type: "university", provinceCode: 46 },

  // ─── ĐẠI HỌC Y DƯỢC ───
  { name: "Đại học Y Hà Nội", shortName: "HMU", type: "university", provinceCode: 1 },
  { name: "Đại học Y Dược TP.HCM", shortName: "UMP", type: "university", provinceCode: 79 },
  { name: "Đại học Y Dược Huế", shortName: "HueUMP", type: "university", provinceCode: 46 },
  { name: "Đại học Y Dược Hải Phòng", shortName: "HPMU", type: "university", provinceCode: 31 },
  { name: "Đại học Y Dược Thái Bình", shortName: "TBMU", type: "university", provinceCode: 34 },
  { name: "Đại học Y Dược Cần Thơ", shortName: "CTUMP", type: "university", provinceCode: 92 },
  { name: "Đại học Y khoa Phạm Ngọc Thạch", shortName: "PNTU", type: "university", provinceCode: 79 },
  { name: "Đại học Dược Hà Nội", shortName: "HUP", type: "university", provinceCode: 1 },
  { name: "Đại học Răng Hàm Mặt", shortName: null, type: "university", provinceCode: 79 },
  { name: "Đại học Y tế Công cộng", shortName: "HUPH", type: "university", provinceCode: 1 },
  { name: "Đại học Điều dưỡng Nam Định", shortName: "NDUN", type: "university", provinceCode: 36 },

  // ─── ĐẠI HỌC NGOẠI NGỮ ───
  { name: "Đại học Ngoại ngữ - ĐHQGHN", shortName: "ULIS", type: "university", provinceCode: 1 },
  { name: "Đại học Ngoại ngữ - Tin học TP.HCM", shortName: "HUFLIT", type: "university", provinceCode: 79 },
  { name: "Đại học Hà Nội", shortName: "HANU", type: "university", provinceCode: 1 },

  // ─── ĐẠI HỌC LUẬT ───
  { name: "Đại học Luật Hà Nội", shortName: "HLU", type: "university", provinceCode: 1 },
  { name: "Đại học Luật TP.HCM", shortName: "HCMULAW", type: "university", provinceCode: 79 },
  { name: "Đại học Luật - Đại học Huế", shortName: null, type: "university", provinceCode: 46 },

  // ─── ĐẠI HỌC NÔNG LÂM & MÔI TRƯỜNG ───
  { name: "Học viện Nông nghiệp Việt Nam", shortName: "VNUA", type: "academy", provinceCode: 1 },
  { name: "Đại học Nông Lâm TP.HCM", shortName: "NLU", type: "university", provinceCode: 79 },
  { name: "Đại học Nông Lâm Huế", shortName: "HUAF", type: "university", provinceCode: 46 },
  { name: "Đại học Nông Lâm Thái Nguyên", shortName: "TUAF", type: "university", provinceCode: 19 },
  { name: "Đại học Lâm nghiệp", shortName: "VFU", type: "university", provinceCode: 1 },
  { name: "Đại học Tài nguyên và Môi trường Hà Nội", shortName: "HUNRE", type: "university", provinceCode: 1 },
  { name: "Đại học Tài nguyên và Môi trường TP.HCM", shortName: "HCMUNRE", type: "university", provinceCode: 79 },

  // ─── ĐẠI HỌC NGHỆ THUẬT & KIẾN TRÚC ───
  { name: "Đại học Kiến trúc Hà Nội", shortName: "HAU", type: "university", provinceCode: 1 },
  { name: "Đại học Kiến trúc TP.HCM", shortName: "UAH", type: "university", provinceCode: 79 },
  { name: "Đại học Mỹ thuật Việt Nam", shortName: "VNUFA", type: "university", provinceCode: 1 },
  { name: "Đại học Mỹ thuật TP.HCM", shortName: "HCMUFA", type: "university", provinceCode: 79 },
  { name: "Đại học Sân khấu - Điện ảnh Hà Nội", shortName: null, type: "university", provinceCode: 1 },

  // ─── ĐẠI HỌC AN NINH & QUÂN ĐỘI ───
  { name: "Đại học An ninh Nhân dân", shortName: "PPA", type: "university", provinceCode: 79 },
  { name: "Đại học Cảnh sát Nhân dân", shortName: "PPA-CS", type: "university", provinceCode: 79 },
  { name: "Đại học Phòng cháy Chữa cháy", shortName: "UF", type: "university", provinceCode: 1 },

  // ─── ĐẠI HỌC ĐỊA PHƯƠNG & VÙNG ───
  { name: "Đại học Cần Thơ", shortName: "CTU", type: "university", provinceCode: 92 },
  { name: "Đại học Đà Lạt", shortName: "DLU", type: "university", provinceCode: 68 },
  { name: "Đại học Nha Trang", shortName: "NTU", type: "university", provinceCode: 56 },
  { name: "Đại học Hải Phòng", shortName: "HPU", type: "university", provinceCode: 31 },
  { name: "Đại học Hồng Đức", shortName: "HDU", type: "university", provinceCode: 38 },
  { name: "Đại học Tây Nguyên", shortName: "TNU-TN", type: "university", provinceCode: 66 },
  { name: "Đại học An Giang", shortName: "AGU", type: "university", provinceCode: 89 },
  { name: "Đại học Trà Vinh", shortName: "TVU", type: "university", provinceCode: 84 },
  { name: "Đại học Bạc Liêu", shortName: "BLU", type: "university", provinceCode: 95 },
  { name: "Đại học Hạ Long", shortName: "UHL", type: "university", provinceCode: 22 },
  { name: "Đại học Thủ Dầu Một", shortName: "TDMU", type: "university", provinceCode: 74 },
  { name: "Đại học Sài Gòn", shortName: "SGU", type: "university", provinceCode: 79 },
  { name: "Đại học Thủ đô Hà Nội", shortName: "HNMU", type: "university", provinceCode: 1 },
  { name: "Đại học Tây Bắc", shortName: "UTB", type: "university", provinceCode: 14 },
  { name: "Đại học Phú Yên", shortName: "PYU", type: "university", provinceCode: 54 },
  { name: "Đại học Khánh Hòa", shortName: "UKH", type: "university", provinceCode: 56 },
  { name: "Đại học Quảng Bình", shortName: "QBU", type: "university", provinceCode: 44 },
  { name: "Đại học Quảng Nam", shortName: "QNU-QN", type: "university", provinceCode: 49 },
  { name: "Đại học Hà Tĩnh", shortName: "HATU", type: "university", provinceCode: 42 },
  { name: "Đại học Phạm Văn Đồng", shortName: "PVD", type: "university", provinceCode: 51 },
  { name: "Đại học Văn Lang", shortName: "VLU", type: "university", provinceCode: 79 },
  { name: "Đại học Nguyễn Tất Thành", shortName: "NTTU", type: "university", provinceCode: 79 },
  { name: "Đại học Hutech", shortName: "HUTECH", type: "university", provinceCode: 79 },
  { name: "Đại học Hoa Sen", shortName: "HSU", type: "university", provinceCode: 79 },
  { name: "Đại học Quốc tế Hồng Bàng", shortName: "HIU", type: "university", provinceCode: 79 },
  { name: "Đại học Mở Hà Nội", shortName: "HOU", type: "university", provinceCode: 1 },
  { name: "Đại học Mở TP.HCM", shortName: "OU", type: "university", provinceCode: 79 },
  { name: "Đại học Công nghệ TP.HCM", shortName: "HUTECH", type: "university", provinceCode: 79 },
  { name: "Đại học Kinh tế - Tài chính TP.HCM", shortName: "UEF", type: "university", provinceCode: 79 },
  { name: "Đại học Gia Định", shortName: "GDU", type: "university", provinceCode: 79 },
  { name: "Đại học Văn Hiến", shortName: "VHU", type: "university", provinceCode: 79 },
  { name: "Đại học Công nghệ Đông Á", shortName: "EAUT", type: "university", provinceCode: 66 },
  { name: "Đại học Đông Đô", shortName: "DDU", type: "university", provinceCode: 1 },
  { name: "Đại học Thăng Long", shortName: "TLU-HN", type: "university", provinceCode: 1 },
  { name: "Đại học Đại Nam", shortName: "DNU", type: "university", provinceCode: 1 },
  { name: "Đại học Kinh doanh và Công nghệ Hà Nội", shortName: "HUBT", type: "university", provinceCode: 1 },
  { name: "Đại học VinUni", shortName: "VinUni", type: "university", provinceCode: 1 },

  // ─── HỌC VIỆN ───
  { name: "Học viện Công nghệ Bưu chính Viễn thông", shortName: "PTIT", type: "academy", provinceCode: 1 },
  { name: "Học viện Kỹ thuật Quân sự", shortName: "MTA", type: "academy", provinceCode: 1 },
  { name: "Học viện Ngân hàng", shortName: "BA", type: "academy", provinceCode: 1 },
  { name: "Học viện Tài chính", shortName: "AOF", type: "academy", provinceCode: 1 },
  { name: "Học viện Ngoại giao", shortName: "DAV", type: "academy", provinceCode: 1 },
  { name: "Học viện Báo chí và Tuyên truyền", shortName: "AJC", type: "academy", provinceCode: 1 },
  { name: "Học viện Chính sách và Phát triển", shortName: "APD", type: "academy", provinceCode: 1 },
  { name: "Học viện Quản lý Giáo dục", shortName: "NAEM", type: "academy", provinceCode: 1 },
  { name: "Học viện Hành chính Quốc gia", shortName: "NAPA", type: "academy", provinceCode: 1 },
  { name: "Học viện Phụ nữ Việt Nam", shortName: "VWA", type: "academy", provinceCode: 1 },
  { name: "Học viện Âm nhạc Quốc gia Việt Nam", shortName: "VNAM", type: "academy", provinceCode: 1 },
  { name: "Học viện Thanh thiếu niên Việt Nam", shortName: "VYA", type: "academy", provinceCode: 1 },
  { name: "Học viện Y Dược học Cổ truyền Việt Nam", shortName: "VUTM", type: "academy", provinceCode: 1 },

  // ─── CAO ĐẲNG ───
  { name: "Cao đẳng FPT Polytechnic", shortName: "FPoly", type: "college", provinceCode: 1 },
  { name: "Cao đẳng Kinh tế Đối ngoại", shortName: null, type: "college", provinceCode: 79 },
  { name: "Cao đẳng Công nghệ Thủ Đức", shortName: null, type: "college", provinceCode: 79 },
  { name: "Cao đẳng Sư phạm Trung ương", shortName: null, type: "college", provinceCode: 1 },
  { name: "Cao đẳng Sư phạm Trung ương TP.HCM", shortName: null, type: "college", provinceCode: 79 },
  { name: "Cao đẳng Y tế Hà Nội", shortName: null, type: "college", provinceCode: 1 },
  { name: "Cao đẳng Y Dược Pasteur", shortName: null, type: "college", provinceCode: 1 },
  { name: "Cao đẳng Công thương TP.HCM", shortName: null, type: "college", provinceCode: 79 },
  { name: "Cao đẳng Kinh tế TP.HCM", shortName: null, type: "college", provinceCode: 79 },
  { name: "Cao đẳng Công nghệ và Thương mại Hà Nội", shortName: null, type: "college", provinceCode: 1 },
  { name: "Cao đẳng Lý Tự Trọng TP.HCM", shortName: null, type: "college", provinceCode: 79 },
  { name: "Cao đẳng Kỹ thuật Cao Thắng", shortName: null, type: "college", provinceCode: 79 },
  { name: "Cao đẳng Bách Việt", shortName: null, type: "college", provinceCode: 79 },
  { name: "Cao đẳng Đại Việt", shortName: null, type: "college", provinceCode: 79 },
  { name: "Cao đẳng Quốc tế Sài Gòn", shortName: "SIC", type: "college", provinceCode: 79 },
  { name: "Cao đẳng Viễn Đông", shortName: null, type: "college", provinceCode: 79 },
  { name: "Cao đẳng Việt Mỹ", shortName: null, type: "college", provinceCode: 79 },
  { name: "Cao đẳng Cộng đồng Hà Nội", shortName: null, type: "college", provinceCode: 1 },
  { name: "Cao đẳng Điện tử - Điện lạnh Hà Nội", shortName: null, type: "college", provinceCode: 1 },
  { name: "Cao đẳng Nghề Việt - Đức Hà Tĩnh", shortName: null, type: "college", provinceCode: 42 },
  { name: "Cao đẳng Y tế Bình Dương", shortName: null, type: "college", provinceCode: 74 },
  { name: "Cao đẳng Cần Thơ", shortName: null, type: "college", provinceCode: 92 },
  { name: "Cao đẳng Đà Nẵng", shortName: null, type: "college", provinceCode: 48 },
];

async function seed() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Thiếu MONGODB_URI trong file .env");
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected.");

  console.log(`Upserting ${SCHOOLS.length} schools...`);
  const result = await locationRepository.bulkUpsertSchools(SCHOOLS);
  console.log(
    `  Inserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`
  );

  console.log("Seed schools completed successfully!");
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error("Seed schools failed:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
