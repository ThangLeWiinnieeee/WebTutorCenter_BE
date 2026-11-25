const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

// Stub socket config before loading attendance.service so unit tests do not require socket.io server
const socketConfigPath = require.resolve("../src/configs/socket");
require.cache[socketConfigPath] = {
  id: socketConfigPath,
  filename: socketConfigPath,
  loaded: true,
  exports: {
    emitToUser: () => {},
    emitToAdmins: () => {},
  },
};

const attendanceService = require("../src/services/attendance.service");
const attendanceRepository = require("../src/repositories/attendance.repository");
const classRepository = require("../src/repositories/class.repository");
const tutorRepository = require("../src/repositories/tutor.repository");
const classApplicationRepository = require("../src/repositories/class.application.repository");
const userRepository = require("../src/repositories/user.repository");
const outboxService = require("../src/services/outbox.service");
const MESSAGE = require("../src/constants/message");
const {
  ATTENDANCE_SESSION_STATUS,
  ATTENDANCE_DISPUTE_STATUS,
  ADMIN_OVERRIDE_ACTION,
} = require("../src/constants/attendance");

const mockStartSession = () => ({
  withTransaction: async (work) => work({ id: "mock-session" }),
  endSession: async () => {},
});

test("AT04: computePeriodBounds giữ anchorDay = 31 không bị trôi tháng 2 -> tháng 3 (Asia/Ho_Chi_Minh)", () => {
  // Ngày bắt đầu: 31/01/2026 (giờ VN)
  const jan31VN = new Date("2026-01-31T08:00:00+07:00");
  const period1 = attendanceService.computePeriodBounds(jan31VN, 31, 0);
  const period2 = attendanceService.computePeriodBounds(jan31VN, 31, 1);

  // Kỳ 1: 31/01/2026 00:00+07 -> 27/02/2026 23:59:59.999+07 (vì 2026 không nhuận, ngày kế tiếp 28/02)
  assert.equal(
    period1.startDate.toISOString(),
    new Date("2026-01-31T00:00:00+07:00").toISOString()
  );
  assert.equal(
    period1.nextStartDate.toISOString(),
    new Date("2026-02-28T00:00:00+07:00").toISOString()
  );

  // Kỳ 2: 28/02/2026 00:00+07 -> 30/03/2026 23:59:59.999+07 (khôi phục lại anchorDay = 31 ở tháng 3)
  assert.equal(
    period2.startDate.toISOString(),
    new Date("2026-02-28T00:00:00+07:00").toISOString()
  );
  assert.equal(
    period2.nextStartDate.toISOString(),
    new Date("2026-03-31T00:00:00+07:00").toISOString()
  );
});

test("AT05 & AT06: phân bổ 4 tuần không cộng dồn chỉ tiêu tuần thiếu và gán ngày thứ 29+ vào Ngày dư (targetWeek=0)", () => {
  const period = {
    startDate: new Date("2026-03-01T00:00:00+07:00"),
    endDate: new Date("2026-03-31T23:59:59.999+07:00"),
    sessionsPerWeek: 3,
    stats: {
      week1Count: 1, // Tuần 1 thiếu 2 buổi
      week2Count: 3,
      week3Count: 0,
      week4Count: 0,
      extraDaysCount: 1,
    },
  };

  assert.equal(
    attendanceService.resolveTargetWeek(period, new Date("2026-03-01T10:00:00+07:00")),
    1
  );
  assert.equal(
    attendanceService.resolveTargetWeek(period, new Date("2026-03-08T10:00:00+07:00")),
    2
  );
  // Ngày thứ 29 (29/03/2026) -> Ngày dư (0)
  assert.equal(
    attendanceService.resolveTargetWeek(period, new Date("2026-03-29T10:00:00+07:00")),
    0
  );

  const breakdown = attendanceService.buildWeeksBreakdown(
    period,
    new Date("2026-03-10T12:00:00+07:00")
  );
  assert.equal(breakdown.length, 5); // 4 tuần + 1 Ngày dư
  assert.equal(breakdown[0].target, 3);
  assert.equal(breakdown[0].statusText, "Thiếu 2 buổi");
  // Tuần 2 vẫn giữ target = 3 (không cộng dồn phần thiếu của tuần 1)
  assert.equal(breakdown[1].target, 3);
  assert.equal(breakdown[1].statusText, "Đủ chỉ tiêu");
  assert.equal(breakdown[4].weekNumber, 0);
  assert.equal(breakdown[4].label, "Ngày dư");
  assert.equal(breakdown[4].completedCount, 1);
});

test("AT08: hết hạn cửa sổ 30 phút tự động chuyển CHECKIN_EXPIRED và từ chối xác nhận muộn", async () => {
  const originals = {
    startSession: mongoose.startSession,
    findSessionById: attendanceRepository.findSessionById,
    transitionSessionStatus: attendanceRepository.transitionSessionStatus,
    recomputePeriodStats: attendanceRepository.recomputePeriodStats,
    enqueueNotification: outboxService.enqueueNotification,
  };

  mongoose.startSession = mockStartSession;
  let capturedTransition = null;

  attendanceRepository.findSessionById = async () => ({
    _id: "sess-1",
    periodId: "period-1",
    classId: { _id: "cls-1", classCode: "LOP001" },
    tutorUserId: "tutor-u1",
    posterId: "poster-1",
    sessionNumber: 1,
    status: ATTENDANCE_SESSION_STATUS.WAITING_CHECKIN_CONFIRMATION,
    checkInExpireAt: new Date(Date.now() - 60_000), // Đã hết hạn 1 phút trước
  });

  attendanceRepository.transitionSessionStatus = async (id, fromStatus, update) => {
    capturedTransition = { id, fromStatus, update };
    return {
      _id: id,
      periodId: "period-1",
      classId: { _id: "cls-1", classCode: "LOP001" },
      tutorUserId: "tutor-u1",
      posterId: "poster-1",
      sessionNumber: 1,
      status: update.$set.status,
      failureReason: update.$set.failureReason,
    };
  };
  attendanceRepository.recomputePeriodStats = async () => ({});
  outboxService.enqueueNotification = async () => ({});

  try {
    await assert.rejects(
      () => attendanceService.confirmCheckIn("poster-1", "sess-1"),
      (err) => err.message === MESSAGE.ATTENDANCE_CONFIRM_EXPIRED && err.statusCode === 400
    );
    assert.equal(capturedTransition.fromStatus, ATTENDANCE_SESSION_STATUS.WAITING_CHECKIN_CONFIRMATION);
    assert.equal(capturedTransition.update.$set.status, ATTENDANCE_SESSION_STATUS.CHECKIN_EXPIRED);
  } finally {
    mongoose.startSession = originals.startSession;
    attendanceRepository.findSessionById = originals.findSessionById;
    attendanceRepository.transitionSessionStatus = originals.transitionSessionStatus;
    attendanceRepository.recomputePeriodStats = originals.recomputePeriodStats;
    outboxService.enqueueNotification = originals.enqueueNotification;
  }
});

test("AT11: gia sư không thể Check-in lớp B khi đang có buổi IN_PROGRESS ở lớp A", async () => {
  const originals = {
    findById: classRepository.findById,
    findByUserId: tutorRepository.findByUserId,
    findApprovedByClassId: classApplicationRepository.findApprovedByClassId,
    findLatestPeriodByClassId: attendanceRepository.findLatestPeriodByClassId,
    findPeriodsByClassId: attendanceRepository.findPeriodsByClassId,
    findActiveSessionByTutorId: attendanceRepository.findActiveSessionByTutorId,
  };

  const mockPeriod = {
    _id: "period-B",
    classId: "cls-B",
    startDate: new Date(Date.now() - 86_400_000),
    endDate: new Date(Date.now() + 20 * 86_400_000),
    status: "active",
    sessionsPerWeek: 2,
    minutesPerSession: 90,
    anchorDay: 1,
    periodNumber: 1,
  };

  classRepository.findById = async () => ({
    _id: "cls-B",
    classCode: "LOP002",
    subject: "Lý",
    status: "matched",
    sessionsPerWeek: 2,
    minutesPerSession: 90,
  });
  tutorRepository.findByUserId = async () => ({ _id: "tutor-doc-1" });
  classApplicationRepository.findApprovedByClassId = async () => ({
    _id: "app-B",
    tutorId: "tutor-doc-1",
    feePaid: true,
    feePaidAt: new Date(Date.now() - 86_400_000),
  });
  attendanceRepository.findLatestPeriodByClassId = async () => mockPeriod;
  attendanceRepository.findPeriodsByClassId = async () => [mockPeriod];
  attendanceRepository.findActiveSessionByTutorId = async () => [
    {
      _id: "open-sess-A",
      status: ATTENDANCE_SESSION_STATUS.IN_PROGRESS,
      checkInAt: new Date(Date.now() - 30 * 60_000),
    },
  ];

  try {
    await assert.rejects(
      () =>
        attendanceService.checkInSession("tutor-user-1", "cls-B", {
          photoUrl: "https://example.com/checkin.jpg",
        }),
      (err) => err.message === MESSAGE.ATTENDANCE_ALREADY_IN_PROGRESS && err.statusCode === 409
    );
  } finally {
    classRepository.findById = originals.findById;
    tutorRepository.findByUserId = originals.findByUserId;
    classApplicationRepository.findApprovedByClassId = originals.findApprovedByClassId;
    attendanceRepository.findLatestPeriodByClassId = originals.findLatestPeriodByClassId;
    attendanceRepository.findPeriodsByClassId = originals.findPeriodsByClassId;
    attendanceRepository.findActiveSessionByTutorId = originals.findActiveSessionByTutorId;
  }
});

test("AT13: xác nhận Check-out thiếu thời lượng chuyển INSUFFICIENT_DURATION, đủ thời lượng chuyển VALID", async () => {
  const originals = {
    startSession: mongoose.startSession,
    findSessionById: attendanceRepository.findSessionById,
    transitionSessionStatus: attendanceRepository.transitionSessionStatus,
    recomputePeriodStats: attendanceRepository.recomputePeriodStats,
    enqueueNotification: outboxService.enqueueNotification,
  };

  mongoose.startSession = mockStartSession;
  attendanceRepository.recomputePeriodStats = async () => ({});
  outboxService.enqueueNotification = async () => ({});

  try {
    // Trường hợp 1: 45/90 phút -> INSUFFICIENT_DURATION
    attendanceRepository.findSessionById = async () => ({
      _id: "sess-short",
      periodId: "period-1",
      classId: { _id: "cls-1", classCode: "LOP001" },
      tutorUserId: "tutor-u1",
      posterId: "poster-1",
      sessionNumber: 1,
      durationMinutes: 45,
      requiredMinutes: 90,
      status: ATTENDANCE_SESSION_STATUS.WAITING_CHECKOUT_CONFIRMATION,
      checkOutExpireAt: new Date(Date.now() + 10 * 60_000),
    });
    attendanceRepository.transitionSessionStatus = async (id, fromStatus, update) => ({
      _id: id,
      ...update.$set,
      durationMinutes: 45,
      requiredMinutes: 90,
      sessionNumber: 1,
    });

    const shortRes = await attendanceService.confirmCheckOut("poster-1", "sess-short");
    assert.equal(shortRes.session.status, ATTENDANCE_SESSION_STATUS.INSUFFICIENT_DURATION);

    // Trường hợp 2: 95/90 phút -> VALID
    attendanceRepository.findSessionById = async () => ({
      _id: "sess-ok",
      periodId: "period-1",
      classId: { _id: "cls-1", classCode: "LOP001" },
      tutorUserId: "tutor-u1",
      posterId: "poster-1",
      sessionNumber: 2,
      durationMinutes: 95,
      requiredMinutes: 90,
      status: ATTENDANCE_SESSION_STATUS.WAITING_CHECKOUT_CONFIRMATION,
      checkOutExpireAt: new Date(Date.now() + 10 * 60_000),
    });
    attendanceRepository.transitionSessionStatus = async (id, fromStatus, update) => ({
      _id: id,
      ...update.$set,
      durationMinutes: 95,
      requiredMinutes: 90,
      sessionNumber: 2,
    });

    const okRes = await attendanceService.confirmCheckOut("poster-1", "sess-ok");
    assert.equal(okRes.session.status, ATTENDANCE_SESSION_STATUS.VALID);
  } finally {
    mongoose.startSession = originals.startSession;
    attendanceRepository.findSessionById = originals.findSessionById;
    attendanceRepository.transitionSessionStatus = originals.transitionSessionStatus;
    attendanceRepository.recomputePeriodStats = originals.recomputePeriodStats;
    outboxService.enqueueNotification = originals.enqueueNotification;
  }
});

test("AT17: gửi phản ánh trên buổi VALID không tự hủy trạng thái VALID khi đang chờ Admin xử lý", async () => {
  const originals = {
    startSession: mongoose.startSession,
    findSessionById: attendanceRepository.findSessionById,
    updateSessionById: attendanceRepository.updateSessionById,
    recomputePeriodStats: attendanceRepository.recomputePeriodStats,
    findAllByRole: userRepository.findAllByRole,
    enqueueNotification: outboxService.enqueueNotification,
  };

  mongoose.startSession = mockStartSession;
  let capturedSet = null;
  attendanceRepository.findSessionById = async () => ({
    _id: "sess-valid",
    periodId: "period-1",
    classId: { _id: "cls-1", classCode: "LOP001" },
    tutorUserId: "tutor-u1",
    posterId: "poster-1",
    sessionNumber: 3,
    status: ATTENDANCE_SESSION_STATUS.VALID,
    dispute: { status: ATTENDANCE_DISPUTE_STATUS.NONE },
  });
  attendanceRepository.updateSessionById = async (id, update) => {
    capturedSet = update.$set;
    return {
      _id: id,
      status: update.$set.status,
      sessionNumber: 3,
      requiredMinutes: 90,
      dispute: {
        isDisputed: true,
        status: ATTENDANCE_DISPUTE_STATUS.PENDING,
        reason: update.$set["dispute.reason"],
      },
    };
  };
  attendanceRepository.recomputePeriodStats = async () => ({});
  userRepository.findAllByRole = async () => [{ _id: "admin-1" }];
  outboxService.enqueueNotification = async () => ({});

  try {
    const res = await attendanceService.openDispute("poster-1", "user", "sess-valid", {
      reason: "Gia sư rời lớp sớm 10 phút so với lịch hẹn",
    });
    assert.equal(capturedSet.status, ATTENDANCE_SESSION_STATUS.VALID);
    assert.equal(res.session.status, ATTENDANCE_SESSION_STATUS.VALID);
    assert.equal(res.session.dispute.status, ATTENDANCE_DISPUTE_STATUS.PENDING);
  } finally {
    mongoose.startSession = originals.startSession;
    attendanceRepository.findSessionById = originals.findSessionById;
    attendanceRepository.updateSessionById = originals.updateSessionById;
    attendanceRepository.recomputePeriodStats = originals.recomputePeriodStats;
    userRepository.findAllByRole = originals.findAllByRole;
    outboxService.enqueueNotification = originals.enqueueNotification;
  }
});

test("AT23: Admin duyệt thay học viên quên xác nhận -> VALID, lưu adminOverride và thông báo 2 bên", async () => {
  const originals = {
    startSession: mongoose.startSession,
    findSessionById: attendanceRepository.findSessionById,
    updateSessionById: attendanceRepository.updateSessionById,
    recomputePeriodStats: attendanceRepository.recomputePeriodStats,
    enqueueNotification: outboxService.enqueueNotification,
  };

  mongoose.startSession = mockStartSession;
  const enqueuedRecipients = [];

  attendanceRepository.findSessionById = async () => ({
    _id: "sess-expired-checkout",
    periodId: "period-1",
    classId: { _id: "cls-1", classCode: "LOP001" },
    tutorUserId: "tutor-u1",
    posterId: "poster-1",
    sessionNumber: 4,
    durationMinutes: 95,
    requiredMinutes: 90,
    checkInAt: new Date("2026-03-10T18:00:00+07:00"),
    confirmedCheckInAt: new Date("2026-03-10T18:05:00+07:00"),
    checkInPhoto: { url: "https://example.com/in.jpg" },
    checkOutPhoto: { url: "https://example.com/out.jpg" },
    status: ATTENDANCE_SESSION_STATUS.CHECKOUT_EXPIRED,
    dispute: { status: ATTENDANCE_DISPUTE_STATUS.NONE },
  });

  attendanceRepository.updateSessionById = async (id, update) => ({
    _id: id,
    ...update.$set,
    sessionNumber: 4,
    requiredMinutes: 90,
  });

  let recomputed = false;
  attendanceRepository.recomputePeriodStats = async () => {
    recomputed = true;
    return {};
  };
  outboxService.enqueueNotification = async (payload) => {
    enqueuedRecipients.push(payload.userId);
    return {};
  };

  try {
    const res = await attendanceService.adminConfirmOnBehalf("admin-1", "sess-expired-checkout", {
      action: ADMIN_OVERRIDE_ACTION.VALIDATE_SESSION,
      reason: "Học viên liên hệ hotline xác nhận đã học đủ buổi",
      verifiedDurationMinutes: 95,
    });

    assert.equal(res.session.status, ATTENDANCE_SESSION_STATUS.VALID);
    assert.equal(res.session.adminOverride.isOverridden, true);
    assert.equal(res.session.adminOverride.action, ADMIN_OVERRIDE_ACTION.VALIDATE_SESSION);
    assert.equal(recomputed, true);
    assert.deepEqual(enqueuedRecipients.sort(), ["poster-1", "tutor-u1"]);
  } finally {
    mongoose.startSession = originals.startSession;
    attendanceRepository.findSessionById = originals.findSessionById;
    attendanceRepository.updateSessionById = originals.updateSessionById;
    attendanceRepository.recomputePeriodStats = originals.recomputePeriodStats;
    outboxService.enqueueNotification = originals.enqueueNotification;
  }
});
