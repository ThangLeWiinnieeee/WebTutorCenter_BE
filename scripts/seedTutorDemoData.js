const mongoose = require("mongoose");
const Tutor = require("../src/models/tutor.model");
const User = require("../src/models/user.model");
const { TUTOR_STATUS, OCCUPATION_STATUS } = require("../src/constants/tutor");
const SUBJECTS = require("../src/constants/tutor/subject");

const seedTutorDemoData = async () => {
  try {
    console.log("🌱 Seeding tutor demo data...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/webtutorcenter", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✓ Connected to MongoDB");

    // Create demo users first
    const demoUsers = [
      {
        email: "tutor1@example.com",
        fullName: "Nguyễn Văn Hùng",
        password: "hashedPassword123",
        role: "tutor",
        isEmailVerified: true,
        avatar: "https://ui-avatars.com/api/?name=Ng+V+H&background=4A90E2",
      },
      {
        email: "tutor2@example.com",
        fullName: "Trần Thị Mai",
        password: "hashedPassword123",
        role: "tutor",
        isEmailVerified: true,
        avatar: "https://ui-avatars.com/api/?name=T+T+M&background=F5A623",
      },
      {
        email: "tutor3@example.com",
        fullName: "Phạm Minh Quân",
        password: "hashedPassword123",
        role: "tutor",
        isEmailVerified: true,
        avatar: "https://ui-avatars.com/api/?name=P+M+Q&background=7ED321",
      },
      {
        email: "tutor4@example.com",
        fullName: "Lê Hương Giang",
        password: "hashedPassword123",
        role: "tutor",
        isEmailVerified: true,
        avatar: "https://ui-avatars.com/api/?name=L+H+G&background=BD10E0",
      },
      {
        email: "tutor5@example.com",
        fullName: "Hoàng Anh Tuấn",
        password: "hashedPassword123",
        role: "tutor",
        isEmailVerified: true,
        avatar: "https://ui-avatars.com/api/?name=H+A+T&background=FF6B6B",
      },
    ];

    // Clear existing tutor data
    await Tutor.deleteMany({});
    console.log("✓ Cleared existing tutors");

    // Create users
    const createdUsers = [];
    for (const userData of demoUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        createdUsers.push(user._id);
      } else {
        createdUsers.push(existingUser._id);
      }
    }
    console.log(`✓ Created/found ${createdUsers.length} users`);

    // Create demo tutors with correct structure
    // Using simple numeric IDs for provinces (1=Hà Nội, 2=TPHCM, 3=Đà Nẵng) and districts
    const tutors = [
      {
        userId: createdUsers[0],
        phone: "0912345678",
        subjects: ["Toán", "Vật lý"],
        occupationStatus: OCCUPATION_STATUS.TEACHER,
        currentArea: {
          province: 1, // Hà Nội
          district: 101, // Hoàn Kiếm
        },
        teachingAreas: {
          province: 1, // Hà Nội
          districts: [101, 102, 103], // Hoàn Kiếm, Ba Đình, Đống Đa
        },
        schoolName: "Trường THPT Ngô Sĩ Liên, Hà Nội",
        bio: "Giáo viên Toán và Vật Lý với 5 năm kinh nghiệm. Chuyên dạy các khối lớp từ 9-12 với phương pháp giảng dạy tương tác và dễ hiểu.",
        status: TUTOR_STATUS.APPROVED,
        approvedAt: new Date(),
        availability: [
          { day: "Mon", startTime: "14:00", endTime: "20:00" },
          { day: "Tue", startTime: "14:00", endTime: "20:00" },
          { day: "Wed", startTime: "14:00", endTime: "20:00" },
          { day: "Thu", startTime: "14:00", endTime: "20:00" },
          { day: "Fri", startTime: "14:00", endTime: "20:00" },
          { day: "Sat", startTime: "09:00", endTime: "20:00" },
          { day: "Sun", startTime: "09:00", endTime: "20:00" },
        ],
      },
      {
        userId: createdUsers[1],
        phone: "0934567890",
        subjects: ["Tiếng Anh"],
        occupationStatus: OCCUPATION_STATUS.STUDENT,
        currentArea: {
          province: 1, // Hà Nội
          district: 104, // Cầu Giấy
        },
        teachingAreas: {
          province: 1,
          districts: [104, 105], // Cầu Giấy, Thanh Xuân
        },
        schoolName: "Đại học Ngoại Ngữ - Đại học Quốc Gia Hà Nội",
        bio: "Sinh viên khóa 3 trường Đại học Ngoại Ngữ. Chuyên dạy Tiếng Anh giao tiếp và IELTS. Có chứng chỉ IELTS 7.5.",
        status: TUTOR_STATUS.APPROVED,
        approvedAt: new Date(),
        availability: [
          { day: "Mon", startTime: "16:00", endTime: "21:00" },
          { day: "Tue", startTime: "16:00", endTime: "21:00" },
          { day: "Wed", startTime: "16:00", endTime: "21:00" },
          { day: "Thu", startTime: "16:00", endTime: "21:00" },
          { day: "Fri", startTime: "16:00", endTime: "21:00" },
          { day: "Sat", startTime: "09:00", endTime: "21:00" },
          { day: "Sun", startTime: "09:00", endTime: "21:00" },
        ],
      },
      {
        userId: createdUsers[2],
        phone: "0945678901",
        subjects: ["Hóa học", "Sinh học"],
        occupationStatus: OCCUPATION_STATUS.TEACHER,
        currentArea: {
          province: 2, // TPHCM
          district: 201, // Quận 1
        },
        teachingAreas: {
          province: 2,
          districts: [201, 202, 203], // Quận 1, 2, 3
        },
        schoolName: "Trường THPT Chuyên Nguyễn Huệ, TP HCM",
        bio: "Giáo viên Hóa Học và Sinh Học tại trường THPT chuyên. Có kỹ năng giảng dạy tốt và kinh nghiệm dạy kèm dài hạn.",
        status: TUTOR_STATUS.APPROVED,
        approvedAt: new Date(),
        availability: [
          { day: "Mon", startTime: "15:00", endTime: "21:00" },
          { day: "Tue", startTime: "15:00", endTime: "21:00" },
          { day: "Wed", startTime: "15:00", endTime: "21:00" },
          { day: "Thu", startTime: "15:00", endTime: "21:00" },
          { day: "Fri", startTime: "15:00", endTime: "21:00" },
          { day: "Sat", startTime: "10:00", endTime: "21:00" },
        ],
      },
      {
        userId: createdUsers[3],
        phone: "0956789012",
        subjects: ["Lịch sử", "Địa lý"],
        occupationStatus: OCCUPATION_STATUS.TEACHER,
        currentArea: {
          province: 3, // Đà Nẵng
          district: 301, // Hải Châu
        },
        teachingAreas: {
          province: 3,
          districts: [301, 302], // Hải Châu, Thanh Khê
        },
        schoolName: "Trường THPT Lê Qúy Đôn, Đà Nẵng",
        bio: "Giáo viên Lịch Sử và Địa Lý với 6 năm kinh nghiệm. Dạy kèm với phương pháp gợi nhớ hiệu quả.",
        status: TUTOR_STATUS.APPROVED,
        approvedAt: new Date(),
        availability: [
          { day: "Mon", startTime: "14:00", endTime: "20:00" },
          { day: "Tue", startTime: "14:00", endTime: "20:00" },
          { day: "Wed", startTime: "14:00", endTime: "20:00" },
          { day: "Thu", startTime: "14:00", endTime: "20:00" },
          { day: "Fri", startTime: "14:00", endTime: "20:00" },
          { day: "Sat", startTime: "09:00", endTime: "20:00" },
          { day: "Sun", startTime: "09:00", endTime: "20:00" },
        ],
      },
      {
        userId: createdUsers[4],
        phone: "0967890123",
        subjects: ["Toán", "Tin học"],
        occupationStatus: OCCUPATION_STATUS.STUDENT,
        currentArea: {
          province: 2, // TPHCM
          district: 204, // Quận 5
        },
        teachingAreas: {
          province: 2,
          districts: [204, 205], // Quận 5, 4
        },
        schoolName: "Đại học Công Nghệ - Đại học Quốc Gia TP HCM",
        bio: "Sinh viên năm cuối Khoa Công Nghệ Thông Tin. Dạy Toán và Lập Trình với kinh nghiệm thực tế.",
        status: TUTOR_STATUS.APPROVED,
        approvedAt: new Date(),
        availability: [
          { day: "Mon", startTime: "17:00", endTime: "22:00" },
          { day: "Tue", startTime: "17:00", endTime: "22:00" },
          { day: "Wed", startTime: "17:00", endTime: "22:00" },
          { day: "Thu", startTime: "17:00", endTime: "22:00" },
          { day: "Fri", startTime: "17:00", endTime: "22:00" },
          { day: "Sat", startTime: "09:00", endTime: "22:00" },
          { day: "Sun", startTime: "09:00", endTime: "22:00" },
        ],
      },
    ];

    const createdTutors = await Tutor.insertMany(tutors);
    console.log(`✓ Created ${createdTutors.length} tutors`);

    await mongoose.disconnect();
    console.log("✅ Tutor seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Tutor seeding failed:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

seedTutorDemoData();
