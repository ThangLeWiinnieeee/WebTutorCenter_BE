const userRepository = require("../repositories/user.repository");
const tutorRepository = require("../repositories/tutor.repository");
const notificationService = require("./notification.service");
const { NOTIFICATION_TYPES } = require("../models/notification.model");
const AppError = require("../utils/AppError");
const MESSAGE = require("../constants/message");
const HTTP_STATUS = require("../constants/status");
const ROLES = require("../constants/role");
const { TUTOR_STATUS } = require("../constants/tutor");
const { UserMapper, TutorMapper } = require("../mappers");

// ──────────────────────────── User admin ────────────────────────────

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildUserFilters = ({ keyword, role, isActive, isVerified }) => {
  const filters = {};
  if (keyword) {
    const pattern = new RegExp(escapeRegExp(keyword.trim()), "i");
    filters.$or = [{ fullName: pattern }, { email: pattern }, { phone: pattern }];
  }
  if (role) filters.role = role;
  if (isActive !== undefined) filters.isActive = isActive;
  if (isVerified !== undefined) filters.isVerified = isVerified;
  return filters;
};

const getAdminUsers = async (query) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const filters = buildUserFilters(query);
  const { users, totalItems } = await userRepository.findManyForAdmin(filters, { page, limit });
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  return {
    users: UserMapper.toDTOs(users),
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const updateAdminUser = async (targetUserId, payload) => {
  const updateData = { fullName: payload.fullName, isVerified: payload.isVerified };
  if (payload.phone !== undefined) {
    updateData.phone = payload.phone || null;
    if (payload.phone) updateData.phoneActivated = true;
  }
  if (payload.gender !== undefined) updateData.gender = payload.gender || null;
  if (payload.dateOfBirth !== undefined) updateData.dateOfBirth = payload.dateOfBirth || null;
  const user = await userRepository.updateByAdmin(targetUserId, updateData);
  if (!user) throw new AppError(MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  return UserMapper.toDTO(user);
};

const updateAdminUserStatus = async (adminUserId, targetUserId, isActive) => {
  if (String(adminUserId) === String(targetUserId) && isActive === false) {
    throw new AppError(MESSAGE.ADMIN_SELF_DEACTIVATE, HTTP_STATUS.BAD_REQUEST);
  }
  const user = await userRepository.updateStatus(targetUserId, isActive);
  if (!user) throw new AppError(MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  return UserMapper.toDTO(user);
};

const softDeleteAdminUser = async (adminUserId, targetUserId) => {
  if (String(adminUserId) === String(targetUserId)) {
    throw new AppError(MESSAGE.ADMIN_SELF_DELETE, HTTP_STATUS.BAD_REQUEST);
  }
  const user = await userRepository.softDeleteByAdmin(targetUserId, adminUserId);
  if (!user) throw new AppError(MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  return UserMapper.toDTO(user);
};

// ──────────────────────────── Tutor admin ────────────────────────────

const getPendingTutors = async () => {
  const tutors = await tutorRepository.findAllPending();
  return TutorMapper.toDTOList(tutors);
};

const approveTutor = async (tutorId) => {
  const tutor = await tutorRepository.findById(tutorId);
  if (!tutor) throw new AppError(MESSAGE.TUTOR_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  if (tutor.status !== TUTOR_STATUS.PENDING) {
    throw new AppError("Hồ sơ này không ở trạng thái chờ duyệt", HTTP_STATUS.BAD_REQUEST);
  }
  const updated = await tutorRepository.update(tutorId, { status: TUTOR_STATUS.APPROVED });
  const userId = tutor.userId?._id ?? tutor.userId;
  await userRepository.updateRole(userId, ROLES.TUTOR);
  await notificationService.createNotification({
    userId,
    type: NOTIFICATION_TYPES.TUTOR_APPROVED,
    message: "Chúc mừng! Hồ sơ gia sư của bạn đã được phê duyệt. Bạn chính thức trở thành gia sư.",
  });
  return await TutorMapper.toDTO(updated, null);
};

const rejectTutor = async (tutorId, rejectionReason) => {
  const tutor = await tutorRepository.findById(tutorId);
  if (!tutor) throw new AppError(MESSAGE.TUTOR_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  if (tutor.status !== TUTOR_STATUS.PENDING) {
    throw new AppError("Hồ sơ này không ở trạng thái chờ duyệt", HTTP_STATUS.BAD_REQUEST);
  }
  const updated = await tutorRepository.update(tutorId, { status: TUTOR_STATUS.REJECTED, rejectionReason });
  const userId = tutor.userId?._id ?? tutor.userId;
  await notificationService.createNotification({
    userId,
    type: NOTIFICATION_TYPES.TUTOR_REJECTED,
    message: `Hồ sơ gia sư của bạn đã bị từ chối. Lý do: ${rejectionReason}`,
  });
  return await TutorMapper.toDTO(updated, null);
};

const getDashboardStats = async () => {
  const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
    tutorRepository.countByStatus(TUTOR_STATUS.PENDING),
    tutorRepository.countByStatus(TUTOR_STATUS.APPROVED),
    tutorRepository.countByStatus(TUTOR_STATUS.REJECTED),
  ]);
  return { pendingCount, approvedCount, rejectedCount };
};

module.exports = {
  getAdminUsers,
  updateAdminUser,
  updateAdminUserStatus,
  softDeleteAdminUser,
  getPendingTutors,
  approveTutor,
  rejectTutor,
  getDashboardStats,
};
