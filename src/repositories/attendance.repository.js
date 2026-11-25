const { AttendancePeriod } = require("../models/attendance.period.model");
const { AttendanceSession } = require("../models/attendance.session.model");
const {
  ATTENDANCE_PERIOD_STATUS,
  ATTENDANCE_SESSION_STATUS,
  ATTENDANCE_DISPUTE_STATUS,
} = require("../constants/attendance");

const POPULATE_CLASS_FIELDS = "classCode subject summary sessionsPerWeek minutesPerSession startDate status";
const POPULATE_USER_FIELDS = "fullName email avatar phone";

const NEEDS_REVIEW_STATUSES = [
  ATTENDANCE_SESSION_STATUS.NEEDS_REVIEW,
  ATTENDANCE_SESSION_STATUS.CHECKIN_EXPIRED,
  ATTENDANCE_SESSION_STATUS.CHECKOUT_EXPIRED,
  ATTENDANCE_SESSION_STATUS.INSUFFICIENT_DURATION,
  ATTENDANCE_SESSION_STATUS.REJECTED,
];

const OPEN_SESSION_STATUSES = [
  ATTENDANCE_SESSION_STATUS.WAITING_CHECKIN_CONFIRMATION,
  ATTENDANCE_SESSION_STATUS.IN_PROGRESS,
  ATTENDANCE_SESSION_STATUS.WAITING_CHECKOUT_CONFIRMATION,
];

// ──────────────────────────── AttendancePeriod ────────────────────────────

const createPeriod = async (data, { session } = {}) => {
  const doc = new AttendancePeriod(data);
  return await doc.save({ session });
};

const findPeriodById = async (id, { session } = {}) =>
  AttendancePeriod.findById(id).session(session || null);

const findPeriodsByClassId = async (classId, { session } = {}) =>
  AttendancePeriod.find({ classId })
    .sort({ periodNumber: -1 })
    .session(session || null);

const findPeriodByClassAndNumber = async (classId, periodNumber, { session } = {}) =>
  AttendancePeriod.findOne({ classId, periodNumber }).session(session || null);

const findLatestPeriodByClassId = async (classId, { session } = {}) =>
  AttendancePeriod.findOne({ classId })
    .sort({ periodNumber: -1 })
    .session(session || null);

const updatePeriodById = async (id, update, { session } = {}) =>
  AttendancePeriod.findByIdAndUpdate(id, update, { new: true, session: session || null });

const cancelPeriodsByApplicationId = async (applicationId, { session } = {}) =>
  AttendancePeriod.updateMany(
    {
      applicationId,
      status: { $in: [ATTENDANCE_PERIOD_STATUS.PENDING_START, ATTENDANCE_PERIOD_STATUS.ACTIVE] },
    },
    { $set: { status: ATTENDANCE_PERIOD_STATUS.CANCELLED } },
    { session: session || null }
  );

// ──────────────────────────── AttendanceSession ────────────────────────────

const populateSessionQuery = (query) =>
  query
    .populate("classId", POPULATE_CLASS_FIELDS)
    .populate("tutorUserId", POPULATE_USER_FIELDS)
    .populate("posterId", POPULATE_USER_FIELDS)
    .populate("adminOverride.overriddenBy", "fullName email")
    .populate("dispute.requestedBy", "fullName email")
    .populate("dispute.resolution.resolvedBy", "fullName email");

const createSession = async (data, { session } = {}) => {
  const doc = new AttendanceSession(data);
  return await doc.save({ session });
};

const findSessionById = async (id, { session } = {}) =>
  populateSessionQuery(AttendanceSession.findById(id).session(session || null));

const findSessionsByPeriodId = async (periodId, { status, session } = {}) => {
  const filter = { periodId };
  if (status && status !== "all") {
    filter.status = status;
  }
  return populateSessionQuery(
    AttendanceSession.find(filter)
      .sort({ sessionNumber: -1 })
      .session(session || null)
  );
};

const countSessionsByPeriodId = async (periodId, { session } = {}) =>
  AttendanceSession.countDocuments({ periodId }).session(session || null);

const findMaxSessionNumberByPeriodId = async (periodId, { session } = {}) => {
  const last = await AttendanceSession.findOne({ periodId })
    .sort({ sessionNumber: -1 })
    .select("sessionNumber")
    .session(session || null)
    .lean();
  return last?.sessionNumber || 0;
};

const findActiveSessionByTutorId = async (tutorId, { session } = {}) =>
  AttendanceSession.find({
    tutorId,
    status: { $in: OPEN_SESSION_STATUSES },
  }).session(session || null);

const findOpenSessionByPeriodId = async (periodId, { session } = {}) =>
  populateSessionQuery(
    AttendanceSession.findOne({
      periodId,
      status: { $in: OPEN_SESSION_STATUSES },
    }).session(session || null)
  );

const transitionSessionStatus = async (id, fromStatuses, update, { session } = {}) => {
  const statusCond = Array.isArray(fromStatuses) ? { $in: fromStatuses } : fromStatuses;
  return await populateSessionQuery(
    AttendanceSession.findOneAndUpdate(
      { _id: id, status: statusCond },
      update,
      { new: true, session: session || null }
    )
  );
};

const updateSessionById = async (id, update, { session } = {}) =>
  await populateSessionQuery(
    AttendanceSession.findByIdAndUpdate(id, update, { new: true, session: session || null })
  );

const recomputePeriodStats = async (periodId, { session } = {}) => {
  const sessions = await AttendanceSession.find({ periodId })
    .select("status targetWeek dispute.status")
    .session(session || null)
    .lean();

  const stats = {
    week1Count: 0,
    week2Count: 0,
    week3Count: 0,
    week4Count: 0,
    extraDaysCount: 0,
    totalValidCount: 0,
    needsReviewCount: 0,
  };

  for (const s of sessions) {
    if (s.status === ATTENDANCE_SESSION_STATUS.VALID) {
      stats.totalValidCount += 1;
      if (s.targetWeek === 1) stats.week1Count += 1;
      else if (s.targetWeek === 2) stats.week2Count += 1;
      else if (s.targetWeek === 3) stats.week3Count += 1;
      else if (s.targetWeek === 4) stats.week4Count += 1;
      else stats.extraDaysCount += 1;
    }
    if (
      NEEDS_REVIEW_STATUSES.includes(s.status) ||
      s.dispute?.status === ATTENDANCE_DISPUTE_STATUS.PENDING
    ) {
      stats.needsReviewCount += 1;
    }
  }

  return await AttendancePeriod.findByIdAndUpdate(
    periodId,
    { $set: { stats } },
    { new: true, session: session || null }
  );
};

const findAdminSessionsPage = async ({ filter = {}, page = 1, limit = 10 }) => {
  const skip = (Math.max(1, page) - 1) * limit;
  const [docs, totalItems] = await Promise.all([
    populateSessionQuery(
      AttendanceSession.find(filter)
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ),
    AttendanceSession.countDocuments(filter),
  ]);
  return { docs, totalItems };
};

const countAdminSessionsGrouped = async () => {
  const [total, needsAttention, disputedPending, valid, waitingConfirm] = await Promise.all([
    AttendanceSession.countDocuments({}),
    AttendanceSession.countDocuments({
      $or: [
        { status: { $in: NEEDS_REVIEW_STATUSES } },
        { "dispute.status": ATTENDANCE_DISPUTE_STATUS.PENDING },
      ],
    }),
    AttendanceSession.countDocuments({ "dispute.status": ATTENDANCE_DISPUTE_STATUS.PENDING }),
    AttendanceSession.countDocuments({ status: ATTENDANCE_SESSION_STATUS.VALID }),
    AttendanceSession.countDocuments({
      status: {
        $in: [
          ATTENDANCE_SESSION_STATUS.WAITING_CHECKIN_CONFIRMATION,
          ATTENDANCE_SESSION_STATUS.WAITING_CHECKOUT_CONFIRMATION,
        ],
      },
    }),
  ]);
  return { total, needsAttention, disputedPending, valid, waitingConfirm };
};

const countPendingAttention = async () =>
  AttendanceSession.countDocuments({
    $or: [
      { status: { $in: NEEDS_REVIEW_STATUSES } },
      { "dispute.status": ATTENDANCE_DISPUTE_STATUS.PENDING },
    ],
  });

module.exports = {
  NEEDS_REVIEW_STATUSES,
  OPEN_SESSION_STATUSES,
  createPeriod,
  findPeriodById,
  findPeriodsByClassId,
  findPeriodByClassAndNumber,
  findLatestPeriodByClassId,
  updatePeriodById,
  cancelPeriodsByApplicationId,
  createSession,
  findSessionById,
  findSessionsByPeriodId,
  countSessionsByPeriodId,
  findMaxSessionNumberByPeriodId,
  findActiveSessionByTutorId,
  findOpenSessionByPeriodId,
  transitionSessionStatus,
  updateSessionById,
  recomputePeriodStats,
  findAdminSessionsPage,
  countAdminSessionsGrouped,
  countPendingAttention,
};
