/**
 * Seed dữ liệu demo cho quản lý người dùng và xét duyệt gia sư.
 *
 * Chạy:
 *   npm run seed:users   -> seed user demo
 *   npm run seed:tutors  -> seed hồ sơ gia sư pending
 *   npm run seed:demo    -> seed cả hai
 *
 * Yêu cầu:
 *   - File .env có MONGODB_URI
 *   - Đã seed locations trước: npm run seed:locations
 */

require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../src/models/user.model");
const Tutor = require("../src/models/tutor.model");
const { Province, District } = require("../src/models/location.model");
const { hashPassword } = require("../src/utils/hash");
const ROLES = require("../src/constants/role");
const ACCOUNT_TYPE = require("../src/constants/accountType");
const { TUTOR_STATUS } = require("../src/constants/tutor");
const OCCUPATION_STATUS = require("../src/constants/occupationStatus");

const DEFAULT_PASSWORD = "Password123";

// Ảnh giấy tờ minh chứng (placeholder hiển thị được) — cccdFront/Back nay BẮT BUỘC
// trong tutor.model; thẻ SV / bằng cấp theo đúng quy tắc đăng ký hồ sơ.
const docImage = (label) =>
  `https://placehold.co/800x500/e2e8f0/1e3a5f?text=${encodeURIComponent(label)}`;

const buildTutorDocs = (occupationStatus) => {
  const isStudent = occupationStatus === OCCUPATION_STATUS.STUDENT;
  return {
    cccdFrontImage: docImage("CCCD mặt trước"),
    cccdBackImage: docImage("CCCD mặt sau"),
    studentCardFrontImage: isStudent ? docImage("Thẻ SV mặt trước") : null,
    studentCardBackImage: isStudent ? docImage("Thẻ SV mặt sau") : null,
    certificateImages: isStudent ? [] : [docImage("Bằng cấp")],
  };
};

// Khung giờ định dạng cũ {day, startTime, endTime} → {day, hour} mà tutor.model yêu cầu.
const toHourSlots = (slots = []) =>
  slots.map((s) => ({ day: s.day, hour: Number(String(s.startTime).split(":")[0]) }));

const USER_SEEDS = [
  {
    fullName: "Admin Demo",
    email: "admindemo@gmail.com",
    role: ROLES.ADMIN,
    phone: "0901000001",
    gender: "other",
    dateOfBirth: "1995-01-10",
    isVerified: true,
    phoneActivated: true,
  },
  {
    fullName: "Nguyễn Minh Anh",
    email: "minhanhuser@gmail.com",
    role: ROLES.USER,
    phone: "0901000002",
    gender: "female",
    dateOfBirth: "2002-04-18",
    isVerified: true,
    phoneActivated: true,
  },
  {
    fullName: "Trần Quốc Bảo",
    email: "quocbaouser@gmail.com",
    role: ROLES.USER,
    phone: "0901000003",
    gender: "male",
    dateOfBirth: "2001-09-22",
    isVerified: true,
    phoneActivated: true,
  },
  {
    fullName: "Lê Phương Thảo",
    email: "phuongthaouser@gmail.com",
    role: ROLES.USER,
    phone: "0901000004",
    gender: "female",
    dateOfBirth: "1999-12-05",
    isVerified: false,
    phoneActivated: true,
  },
  {
    fullName: "Phạm Gia Huy",
    email: "giahuyuser@gmail.com",
    role: ROLES.USER,
    phone: "0901000005",
    gender: "male",
    dateOfBirth: "2000-07-14",
    isVerified: true,
    phoneActivated: true,
  },
  {
    fullName: "Đỗ Hoàng Nam",
    email: "hoangnam.inactive@gmail.com",
    role: ROLES.USER,
    phone: "0901000006",
    gender: "male",
    dateOfBirth: "1998-03-25",
    isActive: false,
    isVerified: true,
    phoneActivated: true,
  },
  {
    fullName: "Vũ Thu Hà",
    email: "thuhatutor@gmail.com",
    role: ROLES.TUTOR,
    phone: "0901000007",
    gender: "female",
    dateOfBirth: "1997-11-11",
    isVerified: true,
    phoneActivated: true,
  },
  {
    fullName: "Bùi Đức Long",
    email: "duclongtutor@gmail.com",
    role: ROLES.TUTOR,
    phone: "0901000008",
    gender: "male",
    dateOfBirth: "1996-06-20",
    isVerified: true,
    phoneActivated: true,
  },
  {
    fullName: "Hoàng Ngọc Linh",
    email: "ngoclinhuser@gmail.com",
    role: ROLES.USER,
    phone: "0901000009",
    gender: "female",
    dateOfBirth: "2003-02-08",
    isVerified: true,
    phoneActivated: true,
  },
  {
    fullName: "Mai Tuấn Kiệt",
    email: "tuankietuser@gmail.com",
    role: ROLES.USER,
    phone: "0901000010",
    gender: "male",
    dateOfBirth: "2002-10-30",
    isVerified: false,
    phoneActivated: true,
  },
  {
    fullName: "Đặng Khánh Vy",
    email: "khanhvyuser@gmail.com",
    role: ROLES.USER,
    phone: "0901000011",
    gender: "female",
    dateOfBirth: "2000-05-19",
    isVerified: true,
    phoneActivated: true,
  },
  {
    fullName: "Ngô Thanh Tùng",
    email: "thanhtunguser@gmail.com",
    role: ROLES.USER,
    phone: "0901000012",
    gender: "male",
    dateOfBirth: "1999-08-16",
    isVerified: true,
    phoneActivated: false,
  },
];

const PENDING_TUTOR_SEEDS = [
  {
    fullName: "Nguyễn Hà My",
    email: "hamypending@gmail.com",
    phone: "0912000001",
    gender: "female",
    dateOfBirth: "2001-01-12",
    subjects: ["Toán", "Vật lý"],
    occupationStatus: OCCUPATION_STATUS.STUDENT,
    schoolName: "Đại học Sư phạm",
    graduationYear: null,
    bio: "Sinh viên năm cuối ngành sư phạm, có kinh nghiệm kèm học sinh THCS và THPT mất gốc môn Toán.",
    availability: [
      { day: "Mon", startTime: "18:00", endTime: "20:00" },
      { day: "Wed", startTime: "18:00", endTime: "20:00" },
    ],
  },
  {
    fullName: "Trần Nhật Minh",
    email: "nhatminhpending@gmail.com",
    phone: "0912000002",
    gender: "male",
    dateOfBirth: "1998-09-03",
    subjects: ["Tiếng Anh", "Tiếng Nhật"],
    occupationStatus: OCCUPATION_STATUS.GRADUATED,
    schoolName: "Đại học Ngoại ngữ",
    graduationYear: 2021,
    bio: "Tốt nghiệp chuyên ngành ngôn ngữ, ưu tiên dạy giao tiếp căn bản và luyện thi chứng chỉ cho học sinh.",
    availability: [
      { day: "Tue", startTime: "19:00", endTime: "21:00" },
      { day: "Sat", startTime: "08:00", endTime: "10:00" },
    ],
  },
  {
    fullName: "Lê Bảo Châu",
    email: "baochaupending@gmail.com",
    phone: "0912000003",
    gender: "female",
    dateOfBirth: "1995-04-21",
    subjects: ["Hóa học", "Sinh học"],
    occupationStatus: OCCUPATION_STATUS.TEACHER,
    schoolName: "Đại học Khoa học Tự nhiên",
    graduationYear: 2017,
    bio: "Giáo viên có kinh nghiệm dạy nhóm nhỏ, tập trung xây nền tảng và luyện đề theo năng lực từng học sinh.",
    availability: [
      { day: "Thu", startTime: "18:30", endTime: "20:30" },
      { day: "Sun", startTime: "14:00", endTime: "16:00" },
    ],
  },
  {
    fullName: "Phạm Minh Khang",
    email: "minhkhangpending@gmail.com",
    phone: "0912000004",
    gender: "male",
    dateOfBirth: "2000-12-09",
    subjects: ["Tin học", "Lập trình"],
    occupationStatus: OCCUPATION_STATUS.STUDENT,
    schoolName: "Đại học Bách khoa",
    graduationYear: null,
    bio: "Có kinh nghiệm hướng dẫn lập trình cơ bản, thuật toán nhập môn và tin học văn phòng cho học sinh mới bắt đầu.",
    availability: [
      { day: "Fri", startTime: "18:00", endTime: "20:00" },
      { day: "Sun", startTime: "09:00", endTime: "11:00" },
    ],
  },
  {
    fullName: "Võ Thanh Trúc",
    email: "thanhtructutor@gmail.com",
    phone: "0912000005",
    gender: "female",
    dateOfBirth: "1999-07-27",
    subjects: ["Ngữ văn", "Lịch sử"],
    occupationStatus: OCCUPATION_STATUS.GRADUATED,
    schoolName: "Đại học Khoa học Xã hội và Nhân văn",
    graduationYear: 2022,
    bio: "Yêu thích phương pháp học qua sơ đồ tư duy, hỗ trợ học sinh cải thiện kỹ năng viết và phân tích đề.",
    availability: [
      { day: "Mon", startTime: "19:00", endTime: "21:00" },
      { day: "Sat", startTime: "15:00", endTime: "17:00" },
    ],
  },
  {
    fullName: "Đặng Đức Anh",
    email: "ducanhpending@gmail.com",
    phone: "0912000006",
    gender: "male",
    dateOfBirth: "1997-05-06",
    subjects: ["Kinh tế"],
    occupationStatus: OCCUPATION_STATUS.GRADUATED,
    schoolName: "Đại học Kinh tế",
    graduationYear: 2019,
    bio: "Hỗ trợ sinh viên và học sinh định hướng ngành kinh tế, giải thích dễ hiểu các kiến thức kinh tế nền tảng.",
    availability: [
      { day: "Wed", startTime: "19:00", endTime: "21:00" },
      { day: "Sun", startTime: "16:00", endTime: "18:00" },
    ],
  },
  {
    fullName: "Huỳnh Mai Chi",
    email: "maichitutor@gmail.com",
    phone: "0912000007",
    gender: "female",
    dateOfBirth: "2002-03-15",
    subjects: ["Tiếng Hàn", "Tiếng Anh"],
    occupationStatus: OCCUPATION_STATUS.STUDENT,
    schoolName: "Đại học Hà Nội",
    graduationYear: null,
    bio: "Tập trung dạy phát âm, từ vựng nền tảng và tạo lộ trình học ngoại ngữ nhẹ nhàng cho người mới bắt đầu.",
    availability: [
      { day: "Tue", startTime: "18:00", endTime: "20:00" },
      { day: "Thu", startTime: "18:00", endTime: "20:00" },
    ],
  },
  {
    fullName: "Đinh Quốc Việt",
    email: "quocviettutor@gmail.com",
    phone: "0912000008",
    gender: "male",
    dateOfBirth: "1994-10-02",
    subjects: ["Vật lý", "Toán cao cấp"],
    occupationStatus: OCCUPATION_STATUS.TEACHER,
    schoolName: "Đại học Sư phạm Kỹ thuật",
    graduationYear: 2016,
    bio: "Có kinh nghiệm luyện thi đại học và hỗ trợ sinh viên năm nhất củng cố kiến thức toán, lý đại cương.",
    availability: [
      { day: "Fri", startTime: "19:00", endTime: "21:00" },
      { day: "Sat", startTime: "09:00", endTime: "11:00" },
    ],
  },
  {
    fullName: "Lý Ngọc Hân",
    email: "ngochantutor@gmail.com",
    phone: "0912000009",
    gender: "female",
    dateOfBirth: "2001-06-23",
    subjects: ["Mỹ thuật", "Âm nhạc"],
    occupationStatus: OCCUPATION_STATUS.STUDENT,
    schoolName: "Đại học Mỹ thuật",
    graduationYear: null,
    bio: "Hỗ trợ học sinh phát triển tư duy sáng tạo, kỹ năng quan sát và thực hành mỹ thuật căn bản.",
    availability: [
      { day: "Sat", startTime: "13:30", endTime: "15:30" },
      { day: "Sun", startTime: "09:00", endTime: "11:00" },
    ],
  },
  {
    fullName: "Cao Tuấn Phong",
    email: "tuanphongtutor@gmail.com",
    phone: "0912000010",
    gender: "male",
    dateOfBirth: "1996-02-14",
    subjects: ["Địa lý", "Giáo dục công dân"],
    occupationStatus: OCCUPATION_STATUS.GRADUATED,
    schoolName: "Đại học Sư phạm",
    graduationYear: 2018,
    bio: "Dạy theo hướng liên hệ thực tế, giúp học sinh dễ nhớ kiến thức xã hội và biết cách trình bày bài thi.",
    availability: [
      { day: "Tue", startTime: "20:00", endTime: "22:00" },
      { day: "Sun", startTime: "15:00", endTime: "17:00" },
    ],
  },
  {
    fullName: "Tạ Bích Ngân",
    email: "bichngantutor@gmail.com",
    phone: "0912000011",
    gender: "female",
    dateOfBirth: "1998-08-18",
    subjects: ["Tiếng Trung", "Tiếng Anh"],
    occupationStatus: OCCUPATION_STATUS.GRADUATED,
    schoolName: "Đại học Ngoại thương",
    graduationYear: 2020,
    bio: "Có kinh nghiệm dạy kèm ngoại ngữ cho học sinh cấp 2, cấp 3 và người đi làm cần giao tiếp căn bản.",
    availability: [
      { day: "Mon", startTime: "18:30", endTime: "20:30" },
      { day: "Wed", startTime: "18:30", endTime: "20:30" },
    ],
  },
  {
    fullName: "Lương Hải Đăng",
    email: "haidangtutor@gmail.com",
    phone: "0912000012",
    gender: "male",
    dateOfBirth: "2000-11-28",
    subjects: ["Hóa học đại cương", "Sinh học"],
    occupationStatus: OCCUPATION_STATUS.STUDENT,
    schoolName: "Đại học Y Dược",
    graduationYear: null,
    bio: "Ưu tiên dạy kiến thức nền tảng, giải bài tập theo từng bước và giúp học sinh xây thói quen tự học.",
    availability: [
      { day: "Thu", startTime: "19:00", endTime: "21:00" },
      { day: "Sat", startTime: "18:00", endTime: "20:00" },
    ],
  },
];

const connect = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("Thiếu MONGODB_URI trong file .env");
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected.");
};

const buildUserPayload = (seed, hashedPassword) => ({
  fullName: seed.fullName,
  email: seed.email,
  password: hashedPassword,
  role: seed.role,
  type: ACCOUNT_TYPE.LOCAL,
  phone: seed.phone,
  gender: seed.gender,
  dateOfBirth: seed.dateOfBirth ? new Date(seed.dateOfBirth) : null,
  avatar: seed.avatar || null,
  isActive: seed.isActive ?? true,
  isVerified: seed.isVerified ?? true,
  phoneActivated: seed.phoneActivated ?? Boolean(seed.phone),
  refreshToken: null,
});

const upsertUser = async (seed, hashedPassword) => {
  return await User.findOneAndUpdate(
    { email: seed.email },
    { $set: buildUserPayload(seed, hashedPassword) },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
};

const seedUsers = async (hashedPassword) => {
  console.log(`Seeding ${USER_SEEDS.length} users...`);

  for (const seed of USER_SEEDS) {
    await upsertUser(seed, hashedPassword);
  }

  console.log(`Seeded users. Password mặc định: ${DEFAULT_PASSWORD}`);
};

const getAreaSamples = async (requiredCount) => {
  const provinces = await Province.find({}).sort({ code: 1 }).lean();

  if (provinces.length === 0) {
    throw new Error("Chưa có dữ liệu tỉnh/quận. Hãy chạy npm run seed:locations trước.");
  }

  const samples = [];

  for (const province of provinces) {
    const districts = await District.find({ provinceCode: province.code })
      .sort({ code: 1 })
      .limit(4)
      .lean();

    if (districts.length >= 2) {
      samples.push({ province, districts });
    }

    if (samples.length >= requiredCount) {
      return samples;
    }
  }

  throw new Error("Dữ liệu tỉnh/quận chưa đủ để seed tutor demo.");
};

const seedPendingTutors = async (hashedPassword) => {
  console.log(`Seeding ${PENDING_TUTOR_SEEDS.length} pending tutor applications...`);

  const areas = await getAreaSamples(PENDING_TUTOR_SEEDS.length);

  for (const [index, seed] of PENDING_TUTOR_SEEDS.entries()) {
    const area = areas[index % areas.length];
    const user = await upsertUser(
      {
        fullName: seed.fullName,
        email: seed.email,
        role: ROLES.USER,
        phone: seed.phone,
        gender: seed.gender,
        dateOfBirth: seed.dateOfBirth,
        isVerified: true,
        phoneActivated: true,
      },
      hashedPassword
    );

    await Tutor.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          userId: user._id,
          phone: seed.phone,
          subjects: seed.subjects,
          occupationStatus: seed.occupationStatus,
          teachingAreas: {
            province: area.province.code,
            districts: area.districts.slice(0, 3).map((district) => district.code),
          },
          currentArea: {
            province: area.province.code,
            district: area.districts[0].code,
          },
          schoolName: seed.schoolName,
          graduationYear: seed.graduationYear,
          bio: seed.bio,
          ...buildTutorDocs(seed.occupationStatus),
          status: TUTOR_STATUS.PENDING,
          rejectionReason: null,
          availability: toHourSlots(seed.availability),
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`Seeded pending tutors. Password mặc định: ${DEFAULT_PASSWORD}`);
};

const seed = async () => {
  const mode = process.argv[2] || "all";
  const validModes = ["all", "users", "tutors"];

  if (!validModes.includes(mode)) {
    throw new Error(`Mode không hợp lệ: ${mode}. Dùng một trong: ${validModes.join(", ")}`);
  }

  await connect();
  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);

  if (mode === "all" || mode === "users") {
    await seedUsers(hashedPassword);
  }

  if (mode === "all" || mode === "tutors") {
    await seedPendingTutors(hashedPassword);
  }

  console.log("Seed demo data completed successfully!");
  await mongoose.disconnect();
};

seed().catch(async (err) => {
  console.error("Seed demo data failed:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
