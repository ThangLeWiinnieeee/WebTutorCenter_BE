const AppError = require("../utils/AppError");
const HTTP_STATUS = require("../constants/status");
const MESSAGE = require("../constants/message");
const { TUTOR_STATUS } = require("../constants/tutor");
const ROLES = require("../constants/role");
const { NOTIFICATION_TYPES } = require("../models/notification.model");
const tutorRepository = require("../repositories/tutor.repository");
const userRepository = require("../repositories/user.repository");
const profileChangeRequestRepository = require("../repositories/profileChangeRequest.repository");
const notificationService = require("./notification.service");
const { ProfileChangeRequestMapper } = require("../mappers");

// Các field hồ sơ gia sư được phép đổi (qua duyệt). Field khác (schoolName,
// graduationYear, subjects, status, stats...) bị loại bỏ.
const EDITABLE_FIELDS = ["phone", "occupationStatus", "teachingAreas", "currentArea", "availability", "bio"];

const pickEditableChanges = (body = {}) => {
  const changes = {};
  for (const key of EDITABLE_FIELDS) {
    if (body[key] !== undefined) changes[key] = body[key];
  }
  return changes;
};

const requestChange = async (userId, body = {}) => {
  const tutor = await tutorRepository.findByUserId(userId);
  if (!tutor) throw new AppError(MESSAGE.TUTOR_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  if (tutor.status !== TUTOR_STATUS.APPROVED) {
    throw new AppError(MESSAGE.PROFILE_CHANGE_TUTOR_NOT_APPROVED, HTTP_STATUS.FORBIDDEN);
  }

  const changes = pickEditableChanges(body);
  if (Object.keys(changes).length === 0) {
    throw new AppError(MESSAGE.PROFILE_CHANGE_EMPTY, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  const existingPending = await profileChangeRequestRepository.findPendingByTutorId(tutor._id);
  if (existingPending) {
    throw new AppError(MESSAGE.PROFILE_CHANGE_ALREADY_PENDING, HTTP_STATUS.CONFLICT);
  }

  const request = await profileChangeRequestRepository.create({
    tutorId: tutor._id,
    userId,
    changes,
  });

  // Notify tất cả admin
  const admins = await userRepository.findAllByRole(ROLES.ADMIN);
  const tutorUser = await userRepository.findById(userId);
  const tutorName = tutorUser?.fullName || "Gia sư";
  await Promise.all(
    admins.map((admin) =>
      notificationService.createNotification({
        userId: admin._id,
        type: NOTIFICATION_TYPES.PROFILE_CHANGE_PENDING,
        message: `Gia sư ${tutorName} gửi yêu cầu đổi thông tin hồ sơ, cần được duyệt.`,
      })
    )
  );

  const populated = await profileChangeRequestRepository.findById(request._id);
  return ProfileChangeRequestMapper.toDTO(populated);
};

const getMyPending = async (userId) => {
  const tutor = await tutorRepository.findByUserId(userId);
  if (!tutor) throw new AppError(MESSAGE.TUTOR_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const pending = await profileChangeRequestRepository.findPendingByTutorId(tutor._id);
  if (!pending) return null;

  const populated = await profileChangeRequestRepository.findById(pending._id);
  return ProfileChangeRequestMapper.toDTO(populated);
};

module.exports = { requestChange, getMyPending };
