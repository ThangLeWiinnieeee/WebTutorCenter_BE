require("dotenv").config();
const mongoose = require("mongoose");
const Class = require("../src/models/class.model");
const { ClassApplication } = require("../src/models/class.application.model");
const { AttendancePeriod } = require("../src/models/attendance.period.model");
const { AttendanceSession } = require("../src/models/attendance.session.model");
const User = require("../src/models/user.model");
const Tutor = require("../src/models/tutor.model");
const {
  ATTENDANCE_SESSION_STATUS,
  ATTENDANCE_PERIOD_STATUS,
  ATTENDANCE_DISPUTE_STATUS,
} = require("../src/constants/attendance");

const SAMPLE_PHOTO = "https://placehold.co/640x360/1e3a8a/ffffff?text=WebTutorCenter+Attendance";

async function seedAttendanceClasses() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const baseClass = await Class.findOne({ classCode: "90020" }).lean();
  if (!baseClass) {
    throw new Error("Không tìm thấy lớp mẫu 90020 trong DB");
  }

  const mainTutorUser = await User.findOne({ email: "vo.thanhtung48@webtutor.dev" }).lean();
  const mainTutor = mainTutorUser ? await Tutor.findOne({ userId: mainTutorUser._id }).lean() : null;
  const mainPoster = await User.findOne({ email: "huynh.khanhvy25@webtutor.dev" }).lean();

  const otherTutors = await Tutor.find({
    status: "approved",
    ...(mainTutor ? { _id: { $ne: mainTutor._id } } : {}),
  })
    .limit(3)
    .populate("userId")
    .lean();

  const otherPosters = await User.find({
    role: "user",
    ...(mainPoster ? { _id: { $ne: mainPoster._id } } : {}),
  })
    .limit(3)
    .lean();

  const now = new Date();
  const daysAgo = (d, h = 19) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - d);
    dt.setHours(h, 0, 0, 0);
    return dt;
  };
  const minsAfter = (dt, mins) => new Date(dt.getTime() + mins * 60 * 1000);

  const specs = [
    {
      classCode: "90021",
      subject: "Toán học",
      summary: "Luyện thi THPT Quốc Gia môn Toán 12",
      sessionsPerWeek: 3,
      minutesPerSession: 90,
      feePerSession: 200000,
      studentCount: 1,
      tutor: mainTutor,
      tutorUser: mainTutorUser,
      poster: mainPoster,
      sessions: [
        {
          sessionNumber: 1,
          targetWeek: 1,
          status: ATTENDANCE_SESSION_STATUS.VALID,
          checkInAt: daysAgo(6, 18),
          confirmedCheckInAt: minsAfter(daysAgo(6, 18), 3),
          checkOutAt: minsAfter(daysAgo(6, 18), 95),
          confirmedCheckOutAt: minsAfter(daysAgo(6, 18), 98),
          durationMinutes: 92,
        },
        {
          sessionNumber: 2,
          targetWeek: 1,
          status: ATTENDANCE_SESSION_STATUS.NEEDS_REVIEW,
          checkInAt: daysAgo(2, 19),
          confirmedCheckInAt: minsAfter(daysAgo(2, 19), 5),
          checkOutAt: minsAfter(daysAgo(2, 19), 80),
          confirmedCheckOutAt: null,
          durationMinutes: 75,
          failureReason: "Thời lượng thực tế 75 phút chưa đạt tối thiểu 90 phút.",
          dispute: {
            isDisputed: true,
            status: ATTENDANCE_DISPUTE_STATUS.PENDING,
            requestedByRole: "tutor",
            requestedAt: daysAgo(2, 21),
            reason: "Học viên xin nghỉ sớm 15 phút để đi thi thử, gia sư đã dạy bù bài tập.",
          },
        },
      ],
    },
    {
      classCode: "90022",
      subject: "Tiếng Anh",
      summary: "Luyện giao tiếp & IELTS 6.5+",
      sessionsPerWeek: 2,
      minutesPerSession: 120,
      feePerSession: 250000,
      studentCount: 2,
      tutor: mainTutor,
      tutorUser: mainTutorUser,
      poster: otherPosters[0] || mainPoster,
      sessions: [
        {
          sessionNumber: 1,
          targetWeek: 1,
          status: ATTENDANCE_SESSION_STATUS.VALID,
          checkInAt: daysAgo(5, 19),
          confirmedCheckInAt: minsAfter(daysAgo(5, 19), 2),
          checkOutAt: minsAfter(daysAgo(5, 19), 125),
          confirmedCheckOutAt: minsAfter(daysAgo(5, 19), 128),
          durationMinutes: 123,
        },
        {
          sessionNumber: 2,
          targetWeek: 1,
          status: ATTENDANCE_SESSION_STATUS.WAITING_CHECKIN_CONFIRMATION,
          checkInAt: minsAfter(now, -10),
          checkInExpireAt: minsAfter(now, 20),
          durationMinutes: 0,
        },
      ],
    },
    {
      classCode: "90023",
      subject: "Vật lý",
      summary: "Ôn tập kiến thức Vật lý 11 nâng cao",
      sessionsPerWeek: 2,
      minutesPerSession: 90,
      feePerSession: 180000,
      studentCount: 1,
      tutor: otherTutors[0] || mainTutor,
      tutorUser: otherTutors[0]?.userId || mainTutorUser,
      poster: otherPosters[1] || mainPoster,
      sessions: [
        {
          sessionNumber: 1,
          targetWeek: 1,
          status: ATTENDANCE_SESSION_STATUS.EXPIRED_CHECKIN,
          checkInAt: daysAgo(1, 18),
          checkInExpireAt: minsAfter(daysAgo(1, 18), 30),
          durationMinutes: 0,
          failureReason: "Quá hạn 30 phút người đăng lớp chưa xác nhận Check-in.",
        },
      ],
    },
    {
      classCode: "90024",
      subject: "Ngữ văn",
      summary: "Luyện viết & đọc hiểu ôn thi vào 10",
      sessionsPerWeek: 3,
      minutesPerSession: 90,
      feePerSession: 170000,
      studentCount: 3,
      tutor: otherTutors[1] || mainTutor,
      tutorUser: otherTutors[1]?.userId || mainTutorUser,
      poster: otherPosters[2] || mainPoster,
      sessions: [
        {
          sessionNumber: 1,
          targetWeek: 1,
          status: ATTENDANCE_SESSION_STATUS.WAITING_CHECKOUT_CONFIRMATION,
          checkInAt: minsAfter(now, -105),
          confirmedCheckInAt: minsAfter(now, -100),
          checkOutAt: minsAfter(now, -5),
          checkOutExpireAt: minsAfter(now, 25),
          durationMinutes: 95,
        },
        {
          sessionNumber: 2,
          targetWeek: 1,
          status: ATTENDANCE_SESSION_STATUS.REJECTED,
          checkInAt: daysAgo(3, 19),
          confirmedCheckInAt: minsAfter(daysAgo(3, 19), 5),
          checkOutAt: minsAfter(daysAgo(3, 19), 95),
          durationMinutes: 90,
          rejectionReason: "Học viên bấm từ chối nhầm, cần Admin rà soát.",
          dispute: {
            isDisputed: true,
            status: ATTENDANCE_DISPUTE_STATUS.PENDING,
            requestedByRole: "user",
            requestedAt: daysAgo(3, 21),
            reason: "Phụ huynh bấm nhầm nút từ chối, thực tế gia sư dạy đủ 90 phút.",
          },
        },
      ],
    },
  ];

  for (const spec of specs) {
    if (!spec.tutor || !spec.tutorUser || !spec.poster) {
      console.log(`Skipping ${spec.classCode}: missing tutor/poster`);
      continue;
    }

    let cls = await Class.findOne({ classCode: spec.classCode });
    if (!cls) {
      const { _id, __v, createdAt, updatedAt, ...rest } = baseClass;
      cls = await Class.create({
        ...rest,
        classCode: spec.classCode,
        subject: spec.subject,
        summary: spec.summary,
        sessionsPerWeek: spec.sessionsPerWeek,
        minutesPerSession: spec.minutesPerSession,
        feePerSession: spec.feePerSession,
        studentCount: spec.studentCount,
        createdBy: spec.poster._id,
        status: "approved",
        assignedTutorId: spec.tutor._id,
      });
    }

    let app = await ClassApplication.findOne({ classId: cls._id, tutorId: spec.tutor._id });
    if (!app) {
      app = await ClassApplication.create({
        classId: cls._id,
        tutorId: spec.tutor._id,
        status: "approved",
        origin: "apply",
        feePaid: true,
      });
    }

    const startDate = daysAgo(7, 0);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    let period = await AttendancePeriod.findOne({ classId: cls._id, periodNumber: 1 });
    if (!period) {
      const validCount = spec.sessions.filter((s) => s.status === ATTENDANCE_SESSION_STATUS.VALID).length;
      const needsCount = spec.sessions.filter((s) =>
        [
          ATTENDANCE_SESSION_STATUS.NEEDS_REVIEW,
          ATTENDANCE_SESSION_STATUS.EXPIRED_CHECKIN,
          ATTENDANCE_SESSION_STATUS.REJECTED,
        ].includes(s.status),
      ).length;

      period = await AttendancePeriod.create({
        classId: cls._id,
        applicationId: app._id,
        tutorId: spec.tutor._id,
        tutorUserId: spec.tutorUser._id,
        posterId: spec.poster._id,
        periodNumber: 1,
        anchorDay: startDate.getDate(),
        startDate,
        endDate,
        sessionsPerWeek: spec.sessionsPerWeek,
        minutesPerSession: spec.minutesPerSession,
        monthlyTarget: spec.sessionsPerWeek * 4,
        status: ATTENDANCE_PERIOD_STATUS.ACTIVE,
        stats: {
          week1Count: validCount,
          totalValidCount: validCount,
          needsReviewCount: needsCount,
        },
      });
    }

    for (const s of spec.sessions) {
      const exists = await AttendanceSession.findOne({
        periodId: period._id,
        sessionNumber: s.sessionNumber,
      });
      if (!exists) {
        await AttendanceSession.create({
          periodId: period._id,
          classId: cls._id,
          applicationId: app._id,
          tutorId: spec.tutor._id,
          tutorUserId: spec.tutorUser._id,
          posterId: spec.poster._id,
          sessionNumber: s.sessionNumber,
          targetWeek: s.targetWeek,
          checkInAt: s.checkInAt || null,
          confirmedCheckInAt: s.confirmedCheckInAt || null,
          checkOutAt: s.checkOutAt || null,
          confirmedCheckOutAt: s.confirmedCheckOutAt || null,
          checkInExpireAt: s.checkInExpireAt || null,
          checkOutExpireAt: s.checkOutExpireAt || null,
          checkInPhoto: s.checkInAt ? { url: SAMPLE_PHOTO, uploadedAt: s.checkInAt } : {},
          checkOutPhoto: s.checkOutAt ? { url: SAMPLE_PHOTO, uploadedAt: s.checkOutAt } : {},
          durationMinutes: s.durationMinutes || 0,
          requiredMinutes: spec.minutesPerSession,
          status: s.status,
          failureReason: s.failureReason || null,
          rejectionReason: s.rejectionReason || null,
          dispute: s.dispute || { isDisputed: false, status: "none" },
        });
      }
    }

    console.log(`Seeded class ${spec.classCode} (${spec.subject}) with ${spec.sessions.length} sessions`);
  }

  await mongoose.disconnect();
  console.log("Done seeding attendance classes!");
}

seedAttendanceClasses().catch((err) => {
  console.error(err);
  process.exit(1);
});
