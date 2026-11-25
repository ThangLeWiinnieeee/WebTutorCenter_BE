const { randomUUID } = require("node:crypto");

const attendanceRepository = require("../repositories/attendance.repository");
const classRepository = require("../repositories/class.repository");
const classApplicationRepository = require("../repositories/class.application.repository");
const tutorRepository = require("../repositories/tutor.repository");
const userRepository = require("../repositories/user.repository");
const outboxService = require("./outbox.service");
const { AttendanceMapper } = require("../mappers");
const { emitToUser, emitToAdmins } = require("../configs/socket");
const AppError = require("../utils/AppError");
const HTTP_STATUS = require("../constants/status");
const MESSAGE = require("../constants/message");
const ROLES = require("../constants/role");
const { CLASS_STATUS } = require("../constants/class");
const { CLASS_APPLICATION_STATUS } = require("../constants/classApplication");
const { NOTIFICATION_TYPES, NOTIFICATION_AUDIENCE } = require("../constants/notification");
const {
  ATTENDANCE_PERIOD_STATUS,
  ATTENDANCE_SESSION_STATUS,
  ATTENDANCE_DISPUTE_STATUS,
  ADMIN_OVERRIDE_ACTION,
  ATTENDANCE_LIMITS,
  ATTENDANCE_SOCKET_EVENTS,
} = require("../constants/attendance");
const { buildPagination } = require("../utils/pagination");
const { withTransaction } = require("../utils/transaction");

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = ATTENDANCE_LIMITS.DAYS_PER_WEEK * DAY_MS;

// ──────────────────────────── Helpers ngày giờ (Asia/Ho_Chi_Minh UTC+7) ────────────────────────────

const toVNComponents = (date) => {
  const shifted = new Date(new Date(date).getTime() + ATTENDANCE_LIMITS.VN_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    monthIndex: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
};

const daysInMonth = (year, monthIndex) => new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

const fromVNStartOfDay = (year, monthIndex, day) =>
  new Date(Date.UTC(year, monthIndex, day, 0, 0, 0, 0) - ATTENDANCE_LIMITS.VN_OFFSET_MS);

const addMonthsVN = (year, monthIndex, offset) => {
  const total = year * 12 + monthIndex + offset;
  const nextYear = Math.floor(total / 12);
  const nextMonth = ((total % 12) + 12) % 12;
  return { year: nextYear, monthIndex: nextMonth };
};

const computePeriodBounds = (baseStartDate, anchorDay, periodOffset = 0) => {
  const base = toVNComponents(baseStartDate);
  const startYM = addMonthsVN(base.year, base.monthIndex, periodOffset);
  const startDay = Math.min(anchorDay, daysInMonth(startYM.year, startYM.monthIndex));
  const startDate = fromVNStartOfDay(startYM.year, startYM.monthIndex, startDay);

  const nextYM = addMonthsVN(base.year, base.monthIndex, periodOffset + 1);
  const nextDay = Math.min(anchorDay, daysInMonth(nextYM.year, nextYM.monthIndex));
  const nextStartDate = fromVNStartOfDay(nextYM.year, nextYM.monthIndex, nextDay);
  const endDate = new Date(nextStartDate.getTime() - 1);

  return { startDate, endDate, nextStartDate };
};

const resolveTargetWeek = (period, timestamp) => {
  const startMs = new Date(period.startDate).getTime();
  const tsMs = new Date(timestamp).getTime();
  if (tsMs < startMs) return 1;
  const weekIndex = Math.floor((tsMs - startMs) / WEEK_MS) + 1;
  if (weekIndex >= 1 && weekIndex <= ATTENDANCE_LIMITS.WEEKS_PER_PERIOD) {
    return weekIndex;
  }
  return 0; // Ngày dư sau 28 ngày đầu
};

const buildWeeksBreakdown = (period, now = new Date()) => {
  const startMs = new Date(period.startDate).getTime();
  const endMs = new Date(period.endDate).getTime();
  const nowMs = now.getTime();
  const target = period.sessionsPerWeek;
  const weekCounts = [
    period.stats?.week1Count || 0,
    period.stats?.week2Count || 0,
    period.stats?.week3Count || 0,
    period.stats?.week4Count || 0,
  ];

  const weeks = [];
  for (let i = 0; i < ATTENDANCE_LIMITS.WEEKS_PER_PERIOD; i += 1) {
    const weekStart = new Date(startMs + i * WEEK_MS);
    const weekEnd = new Date(startMs + (i + 1) * WEEK_MS - 1);
    const completedCount = weekCounts[i];
    const hasEnded = nowMs > weekEnd.getTime();
    const isCurrent = nowMs >= weekStart.getTime() && nowMs <= weekEnd.getTime();

    let statusText;
    if (completedCount > target) {
      statusText = `Vượt ${completedCount - target} buổi`;
    } else if (completedCount === target) {
      statusText = "Đủ chỉ tiêu";
    } else if (hasEnded) {
      statusText = `Thiếu ${target - completedCount} buổi`;
    } else {
      statusText = `Còn ${target - completedCount} buổi để đạt chỉ tiêu tuần`;
    }

    weeks.push({
      weekNumber: i + 1,
      label: `Tuần ${i + 1}`,
      startDate: weekStart,
      endDate: weekEnd,
      target,
      completedCount,
      hasEnded,
      isCurrent,
      statusText,
    });
  }

  const extraStartMs = startMs + ATTENDANCE_LIMITS.WEEKS_PER_PERIOD * WEEK_MS;
  const extraDays =
    endMs >= extraStartMs
      ? {
          weekNumber: 0,
          label: "Ngày dư",
          startDate: new Date(extraStartMs),
          endDate: new Date(endMs),
          target: 0,
          completedCount: period.stats?.extraDaysCount || 0,
          hasEnded: nowMs > endMs,
          isCurrent: nowMs >= extraStartMs && nowMs <= endMs,
          statusText:
            period.stats?.extraDaysCount > 0
              ? `${period.stats.extraDaysCount} buổi học bù/thêm`
              : "Dùng học bù/học thêm",
        }
      : null;

  return extraDays ? [...weeks, extraDays] : weeks;
};

// ──────────────────────────── Helpers thông báo & socket ────────────────────────────

const notifyAdmins = async (type, message, { session, dedupePrefix }) => {
  const admins = await userRepository.findAllByRole(ROLES.ADMIN);
  for (const admin of admins) {
    await outboxService.enqueueNotification(
      {
        dedupeKey: `${dedupePrefix}:${admin._id}`,
        userId: admin._id,
        type,
        message,
        audience: NOTIFICATION_AUDIENCE.ADMIN,
      },
      { session }
    );
  }
};

const emitSessionRealtime = (sessionDTO) => {
  if (!sessionDTO) return;
  emitToUser(sessionDTO.tutorUserId, ATTENDANCE_SOCKET_EVENTS.SESSION_UPDATED, {
    session: sessionDTO,
  });
  emitToUser(sessionDTO.posterId, ATTENDANCE_SOCKET_EVENTS.SESSION_UPDATED, {
    session: sessionDTO,
  });
  emitToAdmins(ATTENDANCE_SOCKET_EVENTS.SESSION_UPDATED, { session: sessionDTO });
};

// ──────────────────────────── Kiểm tra quá hạn (Lazy Transition) ────────────────────────────

const applyLazySessionTransition = async (sessionDoc, now = new Date()) => {
  if (!sessionDoc) return sessionDoc;

  if (
    sessionDoc.status === ATTENDANCE_SESSION_STATUS.WAITING_CHECKIN_CONFIRMATION &&
    sessionDoc.checkInExpireAt &&
    now.getTime() >= new Date(sessionDoc.checkInExpireAt).getTime()
  ) {
    const updated = await attendanceRepository.transitionSessionStatus(
      sessionDoc._id,
      ATTENDANCE_SESSION_STATUS.WAITING_CHECKIN_CONFIRMATION,
      {
        $set: {
          status: ATTENDANCE_SESSION_STATUS.CHECKIN_EXPIRED,
          failureReason: "Quá hạn 30 phút người đăng chưa xác nhận bắt đầu",
        },
      }
    );
    if (updated) {
      await attendanceRepository.recomputePeriodStats(updated.periodId);
      return updated;
    }
    return await attendanceRepository.findSessionById(sessionDoc._id);
  }

  if (
    sessionDoc.status === ATTENDANCE_SESSION_STATUS.WAITING_CHECKOUT_CONFIRMATION &&
    sessionDoc.checkOutExpireAt &&
    now.getTime() >= new Date(sessionDoc.checkOutExpireAt).getTime()
  ) {
    const updated = await attendanceRepository.transitionSessionStatus(
      sessionDoc._id,
      ATTENDANCE_SESSION_STATUS.WAITING_CHECKOUT_CONFIRMATION,
      {
        $set: {
          status: ATTENDANCE_SESSION_STATUS.CHECKOUT_EXPIRED,
          failureReason: "Quá hạn 30 phút người đăng chưa xác nhận kết thúc",
        },
      }
    );
    if (updated) {
      await attendanceRepository.recomputePeriodStats(updated.periodId);
      return updated;
    }
    return await attendanceRepository.findSessionById(sessionDoc._id);
  }

  if (
    sessionDoc.status === ATTENDANCE_SESSION_STATUS.IN_PROGRESS &&
    sessionDoc.confirmedCheckInAt &&
    now.getTime() - new Date(sessionDoc.confirmedCheckInAt).getTime() >=
      ATTENDANCE_LIMITS.MAX_OPEN_SESSION_MS
  ) {
    const updated = await attendanceRepository.transitionSessionStatus(
      sessionDoc._id,
      ATTENDANCE_SESSION_STATUS.IN_PROGRESS,
      {
        $set: {
          status: ATTENDANCE_SESSION_STATUS.NEEDS_REVIEW,
          failureReason: "Quá 12 giờ từ lúc bắt đầu nhưng chưa gửi check-out",
        },
      }
    );
    if (updated) {
      await attendanceRepository.recomputePeriodStats(updated.periodId);
      return updated;
    }
    return await attendanceRepository.findSessionById(sessionDoc._id);
  }

  return sessionDoc;
};

// ──────────────────────────── Khởi tạo & chuyển kỳ tự động ────────────────────────────

const ensurePeriodForApprovedApplication = async (
  applicationId,
  { session, customStartDate } = {}
) => {
  const application = await classApplicationRepository.findById(applicationId, { session });
  if (!application) throw new AppError(MESSAGE.CLASS_APPLICATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  if (
    application.status !== CLASS_APPLICATION_STATUS.APPROVED ||
    !application.feePaid
  ) {
    throw new AppError(MESSAGE.ATTENDANCE_CLASS_NOT_READY, HTTP_STATUS.BAD_REQUEST);
  }

  const classItem = application.classId;
  if (!classItem) throw new AppError(MESSAGE.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const existing = await attendanceRepository.findPeriodByClassAndNumber(
    classItem._id,
    1,
    { session }
  );
  if (existing) return existing;

  const baseDate = customStartDate ? new Date(customStartDate) : new Date(classItem.startDate);
  const { day: anchorDay } = toVNComponents(baseDate);
  const { startDate, endDate } = computePeriodBounds(baseDate, anchorDay, 0);
  const now = new Date();
  const status =
    now.getTime() < startDate.getTime()
      ? ATTENDANCE_PERIOD_STATUS.PENDING_START
      : ATTENDANCE_PERIOD_STATUS.ACTIVE;

  const tutorUserId = application.tutorId?.userId?._id ?? application.tutorId?.userId;
  const tutorId = application.tutorId?._id ?? application.tutorId;
  const posterId = classItem.createdBy?._id ?? classItem.createdBy;

  return await attendanceRepository.createPeriod(
    {
      classId: classItem._id,
      applicationId: application._id,
      tutorId,
      tutorUserId,
      posterId,
      periodNumber: 1,
      anchorDay,
      startDate,
      endDate,
      sessionsPerWeek: classItem.sessionsPerWeek,
      minutesPerSession: classItem.minutesPerSession,
      monthlyTarget: classItem.sessionsPerWeek * ATTENDANCE_LIMITS.WEEKS_PER_PERIOD,
      status,
    },
    { session }
  );
};

const syncPeriodsForClass = async (classItem, approvedApp, now = new Date()) => {
  let latest = await attendanceRepository.findLatestPeriodByClassId(classItem._id);
  if (!latest) {
    if (
      approvedApp &&
      approvedApp.status === CLASS_APPLICATION_STATUS.APPROVED &&
      approvedApp.feePaid
    ) {
      latest = await ensurePeriodForApprovedApplication(approvedApp._id);
    } else {
      return [];
    }
  }

  // Kích hoạt kỳ đang chờ khi tới ngày bắt đầu
  if (
    latest.status === ATTENDANCE_PERIOD_STATUS.PENDING_START &&
    now.getTime() >= new Date(latest.startDate).getTime()
  ) {
    latest = await attendanceRepository.updatePeriodById(latest._id, {
      $set: { status: ATTENDANCE_PERIOD_STATUS.ACTIVE },
    });
  }

  // Tự mở kỳ tiếp theo khi kỳ hiện tại đã kết thúc và lớp vẫn đang MATCHED (P3)
  let guard = 0;
  while (
    latest.status === ATTENDANCE_PERIOD_STATUS.ACTIVE &&
    now.getTime() > new Date(latest.endDate).getTime() &&
    classItem.status === CLASS_STATUS.MATCHED &&
    guard < 12
  ) {
    guard += 1;
    await attendanceRepository.updatePeriodById(latest._id, {
      $set: { status: ATTENDANCE_PERIOD_STATUS.COMPLETED },
    });

    const period1 = await attendanceRepository.findPeriodByClassAndNumber(classItem._id, 1);
    const baseStart = period1 ? period1.startDate : latest.startDate;
    const nextPeriodNumber = latest.periodNumber + 1;
    const { startDate, endDate } = computePeriodBounds(
      baseStart,
      latest.anchorDay,
      nextPeriodNumber - 1
    );

    const existingNext = await attendanceRepository.findPeriodByClassAndNumber(
      classItem._id,
      nextPeriodNumber
    );
    if (existingNext) {
      latest = existingNext;
    } else {
      latest = await attendanceRepository.createPeriod({
        classId: classItem._id,
        applicationId: latest.applicationId,
        tutorId: latest.tutorId,
        tutorUserId: latest.tutorUserId,
        posterId: latest.posterId,
        periodNumber: nextPeriodNumber,
        anchorDay: latest.anchorDay,
        startDate,
        endDate,
        sessionsPerWeek: latest.sessionsPerWeek,
        minutesPerSession: latest.minutesPerSession,
        monthlyTarget: latest.monthlyTarget,
        status: ATTENDANCE_PERIOD_STATUS.ACTIVE,
      });
    }
  }

  return await attendanceRepository.findPeriodsByClassId(classItem._id);
};

const handleApplicationCancelled = async (applicationId, { session } = {}) => {
  await attendanceRepository.cancelPeriodsByApplicationId(applicationId, { session });
};

// ──────────────────────────── Kiểm tra quyền truy cập lớp ────────────────────────────

const resolveAuthorizedClassAccess = async (userId, userRole, classId) => {
  const classItem = await classRepository.findById(classId);
  if (!classItem) throw new AppError(MESSAGE.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const posterId = classItem.createdBy?._id ?? classItem.createdBy;
  const approvedApp = await classApplicationRepository.findApprovedByClassId(classId);
  const tutorUserId = approvedApp?.tutorId?.userId?._id ?? approvedApp?.tutorId?.userId;

  const isAdmin = userRole === ROLES.ADMIN;
  const isPoster = String(posterId) === String(userId);
  const isTutor = Boolean(approvedApp) && String(tutorUserId) === String(userId);

  if (!isAdmin && !isPoster && !isTutor) {
    throw new AppError(MESSAGE.ATTENDANCE_NOT_AUTHORIZED, HTTP_STATUS.FORBIDDEN);
  }

  return { classItem, approvedApp, isAdmin, isPoster, isTutor };
};

// ──────────────────────────── API Nghiệp vụ Người dùng (Gia sư & Người đăng) ────────────────────────────

const getClassOverview = async (userId, userRole, classId, query = {}) => {
  const { classItem, approvedApp, isPoster, isTutor, isAdmin } =
    await resolveAuthorizedClassAccess(userId, userRole, classId);

  const now = new Date();
  const periods = await syncPeriodsForClass(classItem, approvedApp, now);
  if (!periods.length) {
    throw new AppError(MESSAGE.ATTENDANCE_CLASS_NOT_READY, HTTP_STATUS.BAD_REQUEST);
  }

  const targetPeriod = query.periodId
    ? periods.find((p) => String(p._id) === String(query.periodId))
    : periods[0];
  if (!targetPeriod) {
    throw new AppError(MESSAGE.ATTENDANCE_PERIOD_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  const rawSessions = await attendanceRepository.findSessionsByPeriodId(targetPeriod._id);
  const sessions = [];
  for (const s of rawSessions) {
    sessions.push(await applyLazySessionTransition(s, now));
  }

  const freshPeriod =
    (await attendanceRepository.recomputePeriodStats(targetPeriod._id)) || targetPeriod;
  const activeSession = sessions.find((s) =>
    attendanceRepository.OPEN_SESSION_STATUSES.includes(s.status)
  );

  return {
    classInfo: {
      id: classItem._id,
      classCode: classItem.classCode,
      subject: classItem.subject,
      summary: classItem.summary,
      status: classItem.status,
      sessionsPerWeek: classItem.sessionsPerWeek,
      minutesPerSession: classItem.minutesPerSession,
    },
    viewerRole: isAdmin ? "admin" : isTutor ? "tutor" : isPoster ? "poster" : "unknown",
    periods: periods.map((p) => AttendanceMapper.toPeriodDTO(p, buildWeeksBreakdown(p, now))),
    currentPeriod: AttendanceMapper.toPeriodDTO(freshPeriod, buildWeeksBreakdown(freshPeriod, now)),
    activeSession: activeSession ? AttendanceMapper.toSessionDTO(activeSession) : null,
    sessions: AttendanceMapper.toSessionDTOList(sessions),
  };
};

const getClassSessions = async (userId, userRole, classId, query = {}) => {
  const { classItem, approvedApp } = await resolveAuthorizedClassAccess(userId, userRole, classId);
  const periods = await syncPeriodsForClass(classItem, approvedApp);
  if (!periods.length) {
    throw new AppError(MESSAGE.ATTENDANCE_PERIOD_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  const period = query.periodId
    ? periods.find((p) => String(p._id) === String(query.periodId))
    : periods[0];
  if (!period) throw new AppError(MESSAGE.ATTENDANCE_PERIOD_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const rawSessions = await attendanceRepository.findSessionsByPeriodId(period._id, {
    status: query.status,
  });
  const now = new Date();
  const updatedSessions = [];
  for (const s of rawSessions) {
    updatedSessions.push(await applyLazySessionTransition(s, now));
  }
  return {
    sessions: AttendanceMapper.toSessionDTOList(updatedSessions),
  };
};

const getSessionDetail = async (userId, userRole, sessionId) => {
  let sessionDoc = await attendanceRepository.findSessionById(sessionId);
  if (!sessionDoc) throw new AppError(MESSAGE.ATTENDANCE_SESSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const isAdmin = userRole === ROLES.ADMIN;
  const isPoster = String(sessionDoc.posterId?._id ?? sessionDoc.posterId) === String(userId);
  const isTutor = String(sessionDoc.tutorUserId?._id ?? sessionDoc.tutorUserId) === String(userId);

  if (!isAdmin && !isPoster && !isTutor) {
    throw new AppError(MESSAGE.ATTENDANCE_NOT_AUTHORIZED, HTTP_STATUS.FORBIDDEN);
  }

  sessionDoc = await applyLazySessionTransition(sessionDoc);
  return { session: AttendanceMapper.toSessionDTO(sessionDoc) };
};

// Bước 1: Gia sư check-in đầu buổi
const checkInSession = async (userId, classId, { file, photoUrl } = {}) => {
  const resolvedUrl = file?.path || photoUrl;
  if (!resolvedUrl) {
    throw new AppError(MESSAGE.ATTENDANCE_PHOTO_REQUIRED, HTTP_STATUS.BAD_REQUEST);
  }

  const classItem = await classRepository.findById(classId);
  if (!classItem) throw new AppError(MESSAGE.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  if (classItem.status !== CLASS_STATUS.MATCHED) {
    throw new AppError(MESSAGE.ATTENDANCE_PERIOD_INACTIVE, HTTP_STATUS.BAD_REQUEST);
  }

  const tutor = await tutorRepository.findByUserId(userId);
  if (!tutor) throw new AppError(MESSAGE.TUTOR_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const approvedApp = await classApplicationRepository.findApprovedByClassId(classId);
  if (
    !approvedApp ||
    String(approvedApp.tutorId?._id ?? approvedApp.tutorId) !== String(tutor._id) ||
    !approvedApp.feePaid
  ) {
    throw new AppError(MESSAGE.ATTENDANCE_NOT_AUTHORIZED, HTTP_STATUS.FORBIDDEN);
  }

  const now = new Date();
  const periods = await syncPeriodsForClass(classItem, approvedApp, now);
  const activePeriod = periods[0];
  if (!activePeriod || activePeriod.status === ATTENDANCE_PERIOD_STATUS.CANCELLED) {
    throw new AppError(MESSAGE.ATTENDANCE_PERIOD_INACTIVE, HTTP_STATUS.BAD_REQUEST);
  }
  if (now.getTime() < new Date(activePeriod.startDate).getTime()) {
    throw new AppError(MESSAGE.ATTENDANCE_PERIOD_NOT_STARTED, HTTP_STATUS.BAD_REQUEST);
  }

  // Kiểm tra tất cả các buổi đang mở của gia sư (chặn trùng buổi giữa các lớp - AT13)
  const openSessions = await attendanceRepository.findActiveSessionByTutorId(tutor._id);
  for (const s of openSessions) {
    const refreshed = await applyLazySessionTransition(s, now);
    if (attendanceRepository.OPEN_SESSION_STATUSES.includes(refreshed.status)) {
      throw new AppError(MESSAGE.ATTENDANCE_ALREADY_IN_PROGRESS, HTTP_STATUS.CONFLICT);
    }
  }

  const checkInExpireAt = new Date(now.getTime() + ATTENDANCE_LIMITS.CONFIRM_WINDOW_MS);
  const targetWeek = resolveTargetWeek(activePeriod, now);

  let createdSessionId;
  await withTransaction(async (session) => {
    const maxNumber = await attendanceRepository.findMaxSessionNumberByPeriodId(
      activePeriod._id,
      { session }
    );
    const created = await attendanceRepository.createSession(
      {
        periodId: activePeriod._id,
        classId: classItem._id,
        applicationId: approvedApp._id,
        tutorId: tutor._id,
        tutorUserId: userId,
        posterId: activePeriod.posterId,
        sessionNumber: maxNumber + 1,
        targetWeek,
        checkInAt: now,
        checkInExpireAt,
        checkInPhoto: {
          url: resolvedUrl,
          publicId: file?.filename || null,
          uploadedAt: now,
        },
        requiredMinutes: activePeriod.minutesPerSession,
        status: ATTENDANCE_SESSION_STATUS.WAITING_CHECKIN_CONFIRMATION,
      },
      { session }
    );
    createdSessionId = created._id;

    await outboxService.enqueueNotification(
      {
        dedupeKey: `attendance:${created._id}:checkin-req`,
        userId: activePeriod.posterId,
        type: NOTIFICATION_TYPES.ATTENDANCE_CHECKIN_REQUESTED,
        message: `Gia sư vừa gửi ảnh check-in buổi #${created.sessionNumber} lớp ${classItem.classCode} (${classItem.subject}). Vui lòng xác nhận trong vòng 30 phút.`,
      },
      { session }
    );
  });

  const populated = await attendanceRepository.findSessionById(createdSessionId);
  const dto = AttendanceMapper.toSessionDTO(populated);
  emitSessionRealtime(dto);
  return { session: dto };
};

// Bước 2a: Người đăng xác nhận bắt đầu buổi học
const confirmCheckIn = async (userId, sessionId) => {
  let sessionDoc = await attendanceRepository.findSessionById(sessionId);
  if (!sessionDoc) throw new AppError(MESSAGE.ATTENDANCE_SESSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  if (String(sessionDoc.posterId?._id ?? sessionDoc.posterId) !== String(userId)) {
    throw new AppError(MESSAGE.ATTENDANCE_NOT_AUTHORIZED, HTTP_STATUS.FORBIDDEN);
  }

  const now = new Date();
  sessionDoc = await applyLazySessionTransition(sessionDoc, now);
  if (sessionDoc.status === ATTENDANCE_SESSION_STATUS.CHECKIN_EXPIRED) {
    throw new AppError(MESSAGE.ATTENDANCE_CONFIRM_EXPIRED, HTTP_STATUS.BAD_REQUEST);
  }
  if (sessionDoc.status !== ATTENDANCE_SESSION_STATUS.WAITING_CHECKIN_CONFIRMATION) {
    throw new AppError(MESSAGE.ATTENDANCE_INVALID_STATUS, HTTP_STATUS.CONFLICT);
  }

  const period = await attendanceRepository.findPeriodById(sessionDoc.periodId);
  const targetWeek = period ? resolveTargetWeek(period, now) : sessionDoc.targetWeek;
  const classCode = sessionDoc.classId?.classCode || "";

  let updated;
  await withTransaction(async (session) => {
    updated = await attendanceRepository.transitionSessionStatus(
      sessionId,
      ATTENDANCE_SESSION_STATUS.WAITING_CHECKIN_CONFIRMATION,
      {
        $set: {
          status: ATTENDANCE_SESSION_STATUS.IN_PROGRESS,
          confirmedCheckInAt: now,
          targetWeek,
        },
      },
      { session }
    );
    if (!updated) {
      throw new AppError(MESSAGE.ATTENDANCE_INVALID_STATUS, HTTP_STATUS.CONFLICT);
    }

    await outboxService.enqueueNotification(
      {
        dedupeKey: `attendance:${sessionId}:checkin-confirmed`,
        userId: sessionDoc.tutorUserId?._id ?? sessionDoc.tutorUserId,
        type: NOTIFICATION_TYPES.ATTENDANCE_CHECKIN_CONFIRMED,
        message: `Người đăng đã xác nhận bắt đầu buổi #${sessionDoc.sessionNumber} lớp ${classCode}. Thời gian dạy đang được tính.`,
      },
      { session }
    );
  });

  const dto = AttendanceMapper.toSessionDTO(updated);
  emitSessionRealtime(dto);
  return { session: dto };
};

// Bước 2b: Người đăng từ chối bắt đầu buổi học
const rejectCheckIn = async (userId, sessionId, reason) => {
  let sessionDoc = await attendanceRepository.findSessionById(sessionId);
  if (!sessionDoc) throw new AppError(MESSAGE.ATTENDANCE_SESSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  if (String(sessionDoc.posterId?._id ?? sessionDoc.posterId) !== String(userId)) {
    throw new AppError(MESSAGE.ATTENDANCE_NOT_AUTHORIZED, HTTP_STATUS.FORBIDDEN);
  }

  const now = new Date();
  sessionDoc = await applyLazySessionTransition(sessionDoc, now);
  if (sessionDoc.status !== ATTENDANCE_SESSION_STATUS.WAITING_CHECKIN_CONFIRMATION) {
    throw new AppError(MESSAGE.ATTENDANCE_INVALID_STATUS, HTTP_STATUS.CONFLICT);
  }

  const classCode = sessionDoc.classId?.classCode || "";
  let updated;
  await withTransaction(async (session) => {
    updated = await attendanceRepository.transitionSessionStatus(
      sessionId,
      ATTENDANCE_SESSION_STATUS.WAITING_CHECKIN_CONFIRMATION,
      {
        $set: {
          status: ATTENDANCE_SESSION_STATUS.REJECTED,
          rejectionReason: reason,
          failureReason: `Người đăng từ chối check-in: ${reason}`,
        },
      },
      { session }
    );
    if (!updated) {
      throw new AppError(MESSAGE.ATTENDANCE_INVALID_STATUS, HTTP_STATUS.CONFLICT);
    }
    await attendanceRepository.recomputePeriodStats(sessionDoc.periodId, { session });

    await outboxService.enqueueNotification(
      {
        dedupeKey: `attendance:${sessionId}:checkin-rejected`,
        userId: sessionDoc.tutorUserId?._id ?? sessionDoc.tutorUserId,
        type: NOTIFICATION_TYPES.ATTENDANCE_CHECKIN_REJECTED,
        message: `Người đăng đã từ chối yêu cầu check-in buổi #${sessionDoc.sessionNumber} lớp ${classCode}. Lý do: ${reason}`,
      },
      { session }
    );
  });

  const dto = AttendanceMapper.toSessionDTO(updated);
  emitSessionRealtime(dto);
  return { session: dto };
};

// Bước 3: Gia sư gửi check-out cuối buổi
const checkOutSession = async (userId, sessionId, { file, photoUrl } = {}) => {
  const resolvedUrl = file?.path || photoUrl;
  if (!resolvedUrl) {
    throw new AppError(MESSAGE.ATTENDANCE_PHOTO_REQUIRED, HTTP_STATUS.BAD_REQUEST);
  }

  let sessionDoc = await attendanceRepository.findSessionById(sessionId);
  if (!sessionDoc) throw new AppError(MESSAGE.ATTENDANCE_SESSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  if (String(sessionDoc.tutorUserId?._id ?? sessionDoc.tutorUserId) !== String(userId)) {
    throw new AppError(MESSAGE.ATTENDANCE_NOT_AUTHORIZED, HTTP_STATUS.FORBIDDEN);
  }

  const now = new Date();
  sessionDoc = await applyLazySessionTransition(sessionDoc, now);
  if (sessionDoc.status !== ATTENDANCE_SESSION_STATUS.IN_PROGRESS) {
    throw new AppError(MESSAGE.ATTENDANCE_INVALID_STATUS, HTTP_STATUS.CONFLICT);
  }

  const confirmedStartMs = new Date(sessionDoc.confirmedCheckInAt).getTime();
  const durationMinutes = Math.max(0, Math.floor((now.getTime() - confirmedStartMs) / 60000));
  const checkOutExpireAt = new Date(now.getTime() + ATTENDANCE_LIMITS.CONFIRM_WINDOW_MS);
  const classCode = sessionDoc.classId?.classCode || "";

  let updated;
  await withTransaction(async (session) => {
    updated = await attendanceRepository.transitionSessionStatus(
      sessionId,
      ATTENDANCE_SESSION_STATUS.IN_PROGRESS,
      {
        $set: {
          status: ATTENDANCE_SESSION_STATUS.WAITING_CHECKOUT_CONFIRMATION,
          checkOutAt: now,
          checkOutExpireAt,
          durationMinutes,
          checkOutPhoto: {
            url: resolvedUrl,
            publicId: file?.filename || null,
            uploadedAt: now,
          },
        },
      },
      { session }
    );
    if (!updated) {
      throw new AppError(MESSAGE.ATTENDANCE_INVALID_STATUS, HTTP_STATUS.CONFLICT);
    }

    await outboxService.enqueueNotification(
      {
        dedupeKey: `attendance:${sessionId}:checkout-req`,
        userId: sessionDoc.posterId?._id ?? sessionDoc.posterId,
        type: NOTIFICATION_TYPES.ATTENDANCE_CHECKOUT_REQUESTED,
        message: `Gia sư đã gửi ảnh check-out buổi #${sessionDoc.sessionNumber} lớp ${classCode} (thời lượng ${durationMinutes}/${sessionDoc.requiredMinutes} phút). Vui lòng xác nhận trong 30 phút.`,
      },
      { session }
    );
  });

  const dto = AttendanceMapper.toSessionDTO(updated);
  emitSessionRealtime(dto);
  return { session: dto };
};

// Bước 4a: Người đăng xác nhận kết thúc buổi học
const confirmCheckOut = async (userId, sessionId) => {
  let sessionDoc = await attendanceRepository.findSessionById(sessionId);
  if (!sessionDoc) throw new AppError(MESSAGE.ATTENDANCE_SESSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  if (String(sessionDoc.posterId?._id ?? sessionDoc.posterId) !== String(userId)) {
    throw new AppError(MESSAGE.ATTENDANCE_NOT_AUTHORIZED, HTTP_STATUS.FORBIDDEN);
  }

  const now = new Date();
  sessionDoc = await applyLazySessionTransition(sessionDoc, now);
  if (sessionDoc.status === ATTENDANCE_SESSION_STATUS.CHECKOUT_EXPIRED) {
    throw new AppError(MESSAGE.ATTENDANCE_CONFIRM_EXPIRED, HTTP_STATUS.BAD_REQUEST);
  }
  if (sessionDoc.status !== ATTENDANCE_SESSION_STATUS.WAITING_CHECKOUT_CONFIRMATION) {
    throw new AppError(MESSAGE.ATTENDANCE_INVALID_STATUS, HTTP_STATUS.CONFLICT);
  }

  const isDurationEnough = sessionDoc.durationMinutes >= sessionDoc.requiredMinutes;
  const nextStatus = isDurationEnough
    ? ATTENDANCE_SESSION_STATUS.VALID
    : ATTENDANCE_SESSION_STATUS.INSUFFICIENT_DURATION;
  const failureReason = isDurationEnough
    ? null
    : `Chưa đủ thời lượng (${sessionDoc.durationMinutes}/${sessionDoc.requiredMinutes} phút)`;
  const classCode = sessionDoc.classId?.classCode || "";

  let updated;
  await withTransaction(async (session) => {
    updated = await attendanceRepository.transitionSessionStatus(
      sessionId,
      ATTENDANCE_SESSION_STATUS.WAITING_CHECKOUT_CONFIRMATION,
      {
        $set: {
          status: nextStatus,
          confirmedCheckOutAt: now,
          failureReason,
        },
      },
      { session }
    );
    if (!updated) {
      throw new AppError(MESSAGE.ATTENDANCE_INVALID_STATUS, HTTP_STATUS.CONFLICT);
    }

    await attendanceRepository.recomputePeriodStats(sessionDoc.periodId, { session });

    await outboxService.enqueueNotification(
      {
        dedupeKey: `attendance:${sessionId}:checkout-confirmed:${nextStatus}`,
        userId: sessionDoc.tutorUserId?._id ?? sessionDoc.tutorUserId,
        type: isDurationEnough
          ? NOTIFICATION_TYPES.ATTENDANCE_SESSION_VALID
          : NOTIFICATION_TYPES.ATTENDANCE_SESSION_NEEDS_REVIEW,
        message: isDurationEnough
          ? `Buổi #${sessionDoc.sessionNumber} lớp ${classCode} đã hoàn thành hợp lệ và được cộng vào tiến độ!`
          : `Người đăng đã xác nhận kết thúc buổi #${sessionDoc.sessionNumber} lớp ${classCode}, nhưng thời lượng thực tế (${sessionDoc.durationMinutes}/${sessionDoc.requiredMinutes} phút) chưa đủ chuẩn. Vui lòng gửi hỗ trợ nếu cần.`,
      },
      { session }
    );
  });

  const dto = AttendanceMapper.toSessionDTO(updated);
  emitSessionRealtime(dto);
  return { session: dto };
};

// Bước 4b: Người đăng từ chối kết thúc buổi học
const rejectCheckOut = async (userId, sessionId, reason) => {
  let sessionDoc = await attendanceRepository.findSessionById(sessionId);
  if (!sessionDoc) throw new AppError(MESSAGE.ATTENDANCE_SESSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  if (String(sessionDoc.posterId?._id ?? sessionDoc.posterId) !== String(userId)) {
    throw new AppError(MESSAGE.ATTENDANCE_NOT_AUTHORIZED, HTTP_STATUS.FORBIDDEN);
  }

  const now = new Date();
  sessionDoc = await applyLazySessionTransition(sessionDoc, now);
  if (sessionDoc.status !== ATTENDANCE_SESSION_STATUS.WAITING_CHECKOUT_CONFIRMATION) {
    throw new AppError(MESSAGE.ATTENDANCE_INVALID_STATUS, HTTP_STATUS.CONFLICT);
  }

  const classCode = sessionDoc.classId?.classCode || "";
  let updated;
  await withTransaction(async (session) => {
    updated = await attendanceRepository.transitionSessionStatus(
      sessionId,
      ATTENDANCE_SESSION_STATUS.WAITING_CHECKOUT_CONFIRMATION,
      {
        $set: {
          status: ATTENDANCE_SESSION_STATUS.NEEDS_REVIEW,
          rejectionReason: reason,
          failureReason: `Người đăng từ chối check-out: ${reason}`,
        },
      },
      { session }
    );
    if (!updated) {
      throw new AppError(MESSAGE.ATTENDANCE_INVALID_STATUS, HTTP_STATUS.CONFLICT);
    }

    await attendanceRepository.recomputePeriodStats(sessionDoc.periodId, { session });

    await outboxService.enqueueNotification(
      {
        dedupeKey: `attendance:${sessionId}:checkout-rejected`,
        userId: sessionDoc.tutorUserId?._id ?? sessionDoc.tutorUserId,
        type: NOTIFICATION_TYPES.ATTENDANCE_SESSION_NEEDS_REVIEW,
        message: `Người đăng đã từ chối xác nhận kết thúc buổi #${sessionDoc.sessionNumber} lớp ${classCode}. Lý do: ${reason}`,
      },
      { session }
    );
  });

  const dto = AttendanceMapper.toSessionDTO(updated);
  emitSessionRealtime(dto);
  return { session: dto };
};

// ──────────────────────────── Yêu cầu hỗ trợ / Khiếu nại ────────────────────────────

const openDispute = async (userId, userRole, sessionId, { reason, evidenceUrls = [] }) => {
  const sessionDoc = await attendanceRepository.findSessionById(sessionId);
  if (!sessionDoc) throw new AppError(MESSAGE.ATTENDANCE_SESSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const isPoster = String(sessionDoc.posterId?._id ?? sessionDoc.posterId) === String(userId);
  const isTutor = String(sessionDoc.tutorUserId?._id ?? sessionDoc.tutorUserId) === String(userId);
  if (!isPoster && !isTutor) {
    throw new AppError(MESSAGE.ATTENDANCE_NOT_AUTHORIZED, HTTP_STATUS.FORBIDDEN);
  }

  if (sessionDoc.dispute?.status === ATTENDANCE_DISPUTE_STATUS.PENDING) {
    throw new AppError(MESSAGE.ATTENDANCE_DISPUTE_ALREADY_OPEN, HTTP_STATUS.CONFLICT);
  }

  const now = new Date();
  const classCode = sessionDoc.classId?.classCode || "";
  // Quy tắc P6: Nếu buổi đang là VALID, KHÔNG tự trừ buổi khi vừa phản ánh; chỉ đổi status thành NEEDS_REVIEW nếu chưa hợp lệ.
  const keepValid = sessionDoc.status === ATTENDANCE_SESSION_STATUS.VALID;
  const nextStatus = keepValid
    ? ATTENDANCE_SESSION_STATUS.VALID
    : ATTENDANCE_SESSION_STATUS.NEEDS_REVIEW;

  const transitionId = randomUUID();
  let updated;
  await withTransaction(async (session) => {
    updated = await attendanceRepository.updateSessionById(
      sessionId,
      {
        $set: {
          status: nextStatus,
          "dispute.isDisputed": true,
          "dispute.requestedBy": userId,
          "dispute.requestedByRole": isTutor ? "tutor" : "user",
          "dispute.requestedAt": now,
          "dispute.reason": reason,
          "dispute.evidenceUrls": evidenceUrls,
          "dispute.status": ATTENDANCE_DISPUTE_STATUS.PENDING,
        },
      },
      { session }
    );
    await attendanceRepository.recomputePeriodStats(sessionDoc.periodId, { session });

    await notifyAdmins(
      NOTIFICATION_TYPES.ATTENDANCE_DISPUTE_OPENED,
      `Có yêu cầu hỗ trợ / khiếu nại cho buổi #${sessionDoc.sessionNumber} lớp ${classCode}. Lý do: ${reason}`,
      { session, dedupePrefix: `attendance:${sessionId}:dispute:${transitionId}:admin` }
    );
  });

  const dto = AttendanceMapper.toSessionDTO(updated);
  emitSessionRealtime(dto);
  return { session: dto };
};

// ──────────────────────────── Khu vực Quản trị (Admin) ────────────────────────────

const getAdminSessions = async (query = {}) => {
  const { page = 1, limit = 10, status = "all", disputeOnly = false, classCode } = query;
  const filter = {};

  if (status === "needs_attention") {
    filter.$or = [
      { status: { $in: attendanceRepository.NEEDS_REVIEW_STATUSES } },
      { "dispute.status": ATTENDANCE_DISPUTE_STATUS.PENDING },
    ];
  } else if (status && status !== "all") {
    filter.status = status;
  }

  if (disputeOnly) {
    filter["dispute.status"] = ATTENDANCE_DISPUTE_STATUS.PENDING;
  }

  if (classCode && classCode.trim()) {
    const cls = await classRepository.findByClassCode(classCode.trim());
    if (!cls) {
      const counts = await attendanceRepository.countAdminSessionsGrouped();
      return {
        sessions: [],
        counts,
        pagination: buildPagination({ page, limit, totalItems: 0 }),
      };
    }
    filter.classId = cls._id;
  }

  const [{ docs, totalItems }, counts] = await Promise.all([
    attendanceRepository.findAdminSessionsPage({ filter, page, limit }),
    attendanceRepository.countAdminSessionsGrouped(),
  ]);

  return {
    sessions: AttendanceMapper.toSessionDTOList(docs),
    counts,
    pagination: buildPagination({ page, limit, totalItems }),
  };
};

// [MỚI] Admin duyệt điểm danh thay học viên khi học viên quên xác nhận
const adminConfirmOnBehalf = async (
  adminUserId,
  sessionId,
  { action = ADMIN_OVERRIDE_ACTION.VALIDATE_SESSION, reason, verifiedDurationMinutes }
) => {
  const sessionDoc = await attendanceRepository.findSessionById(sessionId);
  if (!sessionDoc) throw new AppError(MESSAGE.ATTENDANCE_SESSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  if (!sessionDoc.checkInPhoto?.url) {
    throw new AppError(MESSAGE.ATTENDANCE_PHOTO_REQUIRED, HTTP_STATUS.BAD_REQUEST);
  }

  const now = new Date();
  const classCode = sessionDoc.classId?.classCode || "";
  const tutorUserId = sessionDoc.tutorUserId?._id ?? sessionDoc.tutorUserId;
  const posterId = sessionDoc.posterId?._id ?? sessionDoc.posterId;
  const transitionId = randomUUID();

  let updated;
  await withTransaction(async (session) => {
    if (
      action === ADMIN_OVERRIDE_ACTION.CONFIRM_CHECKIN_ON_BEHALF &&
      [
        ATTENDANCE_SESSION_STATUS.WAITING_CHECKIN_CONFIRMATION,
        ATTENDANCE_SESSION_STATUS.CHECKIN_EXPIRED,
      ].includes(sessionDoc.status)
    ) {
      updated = await attendanceRepository.updateSessionById(
        sessionId,
        {
          $set: {
            status: ATTENDANCE_SESSION_STATUS.IN_PROGRESS,
            confirmedCheckInAt: sessionDoc.confirmedCheckInAt || sessionDoc.checkInAt || now,
            failureReason: null,
            adminOverride: {
              isOverridden: true,
              overriddenBy: adminUserId,
              overriddenAt: now,
              action,
              reason,
              verifiedDurationMinutes: null,
            },
          },
        },
        { session }
      );
    } else {
      const effectiveDuration =
        verifiedDurationMinutes ||
        Math.max(sessionDoc.durationMinutes || 0, sessionDoc.requiredMinutes);

      if (effectiveDuration < sessionDoc.requiredMinutes) {
        throw new AppError(
          MESSAGE.ATTENDANCE_ADMIN_INSUFFICIENT_DURATION,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const updateFields = {
        status: ATTENDANCE_SESSION_STATUS.VALID,
        confirmedCheckInAt: sessionDoc.confirmedCheckInAt || sessionDoc.checkInAt || now,
        confirmedCheckOutAt: sessionDoc.confirmedCheckOutAt || now,
        durationMinutes: effectiveDuration,
        failureReason: null,
        adminOverride: {
          isOverridden: true,
          overriddenBy: adminUserId,
          overriddenAt: now,
          action,
          reason,
          verifiedDurationMinutes: effectiveDuration,
        },
      };

      if (sessionDoc.dispute?.status === ATTENDANCE_DISPUTE_STATUS.PENDING) {
        updateFields["dispute.status"] = ATTENDANCE_DISPUTE_STATUS.RESOLVED;
        updateFields["dispute.resolution.resolvedBy"] = adminUserId;
        updateFields["dispute.resolution.resolvedAt"] = now;
        updateFields["dispute.resolution.decision"] = "VALID";
        updateFields["dispute.resolution.verifiedDurationMinutes"] = effectiveDuration;
        updateFields["dispute.resolution.notes"] = reason;
      }

      updated = await attendanceRepository.updateSessionById(
        sessionId,
        { $set: updateFields },
        { session }
      );
      await attendanceRepository.recomputePeriodStats(sessionDoc.periodId, { session });
    }

    const notifMsg =
      action === ADMIN_OVERRIDE_ACTION.CONFIRM_CHECKIN_ON_BEHALF
        ? `Admin đã xác nhận bắt đầu buổi #${sessionDoc.sessionNumber} lớp ${classCode} thay cho học viên. Lý do: ${reason}`
        : `Admin đã duyệt hoàn thành hợp lệ buổi #${sessionDoc.sessionNumber} lớp ${classCode} thay cho học viên. Lý do: ${reason}`;

    for (const recipientId of [tutorUserId, posterId].filter(Boolean)) {
      await outboxService.enqueueNotification(
        {
          dedupeKey: `attendance:${sessionId}:admin-confirm:${transitionId}:${recipientId}`,
          userId: recipientId,
          type: NOTIFICATION_TYPES.ATTENDANCE_ADMIN_CONFIRMED,
          message: notifMsg,
        },
        { session }
      );
    }
  });

  const dto = AttendanceMapper.toSessionDTO(updated);
  emitSessionRealtime(dto);
  return { session: dto };
};

// Admin xử lý khiếu nại / sự cố buổi học (có lịch sử quyết định)
const adminResolveSession = async (
  adminUserId,
  sessionId,
  { decision, reason, verifiedDurationMinutes }
) => {
  const sessionDoc = await attendanceRepository.findSessionById(sessionId);
  if (!sessionDoc) throw new AppError(MESSAGE.ATTENDANCE_SESSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const effectiveDuration =
    verifiedDurationMinutes !== undefined
      ? verifiedDurationMinutes
      : sessionDoc.durationMinutes || 0;

  if (decision === "VALID" && effectiveDuration < sessionDoc.requiredMinutes) {
    throw new AppError(MESSAGE.ATTENDANCE_ADMIN_INSUFFICIENT_DURATION, HTTP_STATUS.BAD_REQUEST);
  }

  const now = new Date();
  const classCode = sessionDoc.classId?.classCode || "";
  const tutorUserId = sessionDoc.tutorUserId?._id ?? sessionDoc.tutorUserId;
  const posterId = sessionDoc.posterId?._id ?? sessionDoc.posterId;
  const transitionId = randomUUID();

  const previousDecision = sessionDoc.dispute?.resolution?.decision || null;
  const historyEntry = {
    previousDecision,
    newDecision: decision,
    reason,
    verifiedDurationMinutes: effectiveDuration,
    modifiedBy: adminUserId,
    modifiedAt: now,
  };

  let updated;
  await withTransaction(async (session) => {
    const nextStatus =
      decision === "VALID"
        ? ATTENDANCE_SESSION_STATUS.VALID
        : ATTENDANCE_SESSION_STATUS.INVALIDATED;

    const setFields = {
      status: nextStatus,
      durationMinutes: effectiveDuration,
      failureReason: decision === "INVALIDATED" ? reason : null,
      "dispute.isDisputed": true,
      "dispute.status": ATTENDANCE_DISPUTE_STATUS.RESOLVED,
      "dispute.resolution.resolvedBy": adminUserId,
      "dispute.resolution.resolvedAt": now,
      "dispute.resolution.decision": decision,
      "dispute.resolution.verifiedDurationMinutes": effectiveDuration,
      "dispute.resolution.notes": reason,
    };

    updated = await attendanceRepository.updateSessionById(
      sessionId,
      {
        $set: setFields,
        $push: { "dispute.resolution.history": historyEntry },
      },
      { session }
    );

    await attendanceRepository.recomputePeriodStats(sessionDoc.periodId, { session });

    const label = decision === "VALID" ? "công nhận hợp lệ" : "không công nhận";
    for (const recipientId of [tutorUserId, posterId].filter(Boolean)) {
      await outboxService.enqueueNotification(
        {
          dedupeKey: `attendance:${sessionId}:resolved:${transitionId}:${recipientId}`,
          userId: recipientId,
          type: NOTIFICATION_TYPES.ATTENDANCE_DISPUTE_RESOLVED,
          message: `Admin đã kết luận ${label} cho buổi #${sessionDoc.sessionNumber} lớp ${classCode}. Lý do: ${reason}`,
        },
        { session }
      );
    }
  });

  const dto = AttendanceMapper.toSessionDTO(updated);
  emitSessionRealtime(dto);
  return { session: dto };
};

const adminInitPeriodForClass = async (classId, { startDate } = {}) => {
  const approvedApp = await classApplicationRepository.findApprovedByClassId(classId);
  if (!approvedApp) {
    throw new AppError(MESSAGE.ATTENDANCE_CLASS_NOT_READY, HTTP_STATUS.BAD_REQUEST);
  }
  const period = await ensurePeriodForApprovedApplication(approvedApp._id, {
    customStartDate: startDate,
  });
  return {
    period: AttendanceMapper.toPeriodDTO(period, buildWeeksBreakdown(period)),
  };
};

module.exports = {
  computePeriodBounds,
  resolveTargetWeek,
  buildWeeksBreakdown,
  ensurePeriodForApprovedApplication,
  handleApplicationCancelled,
  getClassOverview,
  getClassSessions,
  getSessionDetail,
  checkInSession,
  confirmCheckIn,
  rejectCheckIn,
  checkOutSession,
  confirmCheckOut,
  rejectCheckOut,
  openDispute,
  getAdminSessions,
  adminConfirmOnBehalf,
  adminResolveSession,
  adminInitPeriodForClass,
};
