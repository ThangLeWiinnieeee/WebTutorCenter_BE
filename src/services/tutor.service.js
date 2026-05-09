const tutorRepository = require("../repositories/tutor.repository");
const userRepository = require("../repositories/user.repository");
const notificationService = require("./notification.service");
const { NOTIFICATION_TYPES } = require("../models/notification.model");
const AppError = require("../utils/AppError");
const MESSAGE = require("../constants/message");
const HTTP_STATUS = require("../constants/status");
const ROLES = require("../constants/role");
const { TUTOR_STATUS } = require("../constants/tutor");
const TutorMapper = require("../mappers/tutor.mapper");

const registerTutor = async (userId, tutorData) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError(MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  const existing = await tutorRepository.findByUserId(userId);
  if (existing) {
    throw new AppError(MESSAGE.TUTOR_ALREADY_REGISTERED, HTTP_STATUS.CONFLICT);
  }

  const tutor = await tutorRepository.create({ userId, ...tutorData });

  await notificationService.createNotification({
    userId,
    type: NOTIFICATION_TYPES.TUTOR_PENDING,
    message: "Hồ sơ gia sư của bạn đang chờ xét duyệt. Chúng tôi sẽ thông báo khi có kết quả.",
  });

  return await TutorMapper.toDTO(tutor, user);
};

const getTutorProfile = async (userId) => {
  const tutor = await tutorRepository.findByUserId(userId);
  if (!tutor) {
    return null;
  }

  const user = await userRepository.findById(userId);

  return await TutorMapper.toDTO(tutor, user);
};

const getPendingTutors = async () => {
  const tutors = await tutorRepository.findAllPending();
  return await TutorMapper.toDTOList(tutors);
};

const approveTutor = async (tutorId) => {
  const tutor = await tutorRepository.findById(tutorId);
  if (!tutor) {
    throw new AppError(MESSAGE.TUTOR_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
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
  if (!tutor) {
    throw new AppError(MESSAGE.TUTOR_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  if (tutor.status !== TUTOR_STATUS.PENDING) {
    throw new AppError("Hồ sơ này không ở trạng thái chờ duyệt", HTTP_STATUS.BAD_REQUEST);
  }

  const updated = await tutorRepository.update(tutorId, {
    status: TUTOR_STATUS.REJECTED,
    rejectionReason,
  });

  const userId = tutor.userId?._id ?? tutor.userId;
  await notificationService.createNotification({
    userId,
    type: NOTIFICATION_TYPES.TUTOR_REJECTED,
    message: `Hồ sơ gia sư của bạn đã bị từ chối. Lý do: ${rejectionReason}`,
  });

  return await TutorMapper.toDTO(updated, null);
};

const getDashboardStats = async () => {
  const pendingCount = await tutorRepository.countByStatus(TUTOR_STATUS.PENDING);
  const approvedCount = await tutorRepository.countByStatus(TUTOR_STATUS.APPROVED);
  const rejectedCount = await tutorRepository.countByStatus(TUTOR_STATUS.REJECTED);

  return { pendingCount, approvedCount, rejectedCount };
};

module.exports = {
  registerTutor,
  getTutorProfile,
  getPendingTutors,
  getDashboardStats,
  approveTutor,
  rejectTutor,
};
