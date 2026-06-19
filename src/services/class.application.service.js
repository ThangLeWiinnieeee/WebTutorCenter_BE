const AppError = require("../utils/AppError");
const HTTP_STATUS = require("../constants/status");
const MESSAGE = require("../constants/message");
const { TUTOR_STATUS } = require("../constants/tutor");
const ROLES = require("../constants/role");
const { NOTIFICATION_TYPES } = require("../models/notification.model");
const { CLASS_APPLICATION_STATUS } = require("../models/class.application.model");
const classRepository = require("../repositories/class.repository");
const classApplicationRepository = require("../repositories/class.application.repository");
const tutorRepository = require("../repositories/tutor.repository");
const userRepository = require("../repositories/user.repository");
const notificationService = require("./notification.service");
const { ClassApplicationMapper } = require("../mappers");

const applyForClass = async (userId, classId) => {
  const classItem = await classRepository.findById(classId);
  if (!classItem) throw new AppError(MESSAGE.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const tutor = await tutorRepository.findByUserId(userId);
  if (!tutor) throw new AppError(MESSAGE.TUTOR_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  if (tutor.status !== TUTOR_STATUS.APPROVED) {
    throw new AppError("Hồ sơ gia sư của bạn chưa được phê duyệt", HTTP_STATUS.FORBIDDEN);
  }

  if (!tutor.subjects.includes(classItem.subject)) {
    throw new AppError(
      `Bạn không thể nhận lớp này vì bạn không đăng ký dạy môn ${classItem.subject}`,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
    );
  }

  const existing = await classApplicationRepository.findByClassAndTutor(classId, tutor._id);
  if (existing) {
    throw new AppError(MESSAGE.CLASS_APPLICATION_ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
  }

  const application = await classApplicationRepository.create({
    classId,
    tutorId: tutor._id,
    status: CLASS_APPLICATION_STATUS.PENDING,
  });

  const [tutorUser, admins] = await Promise.all([
    userRepository.findById(userId),
    userRepository.findAllByRole(ROLES.ADMIN),
  ]);

  const tutorName = tutorUser?.fullName || "Gia sư";
  const notifyAdmins = admins.map((admin) =>
    notificationService.createNotification({
      userId: admin._id,
      type: NOTIFICATION_TYPES.CLASS_APPLICATION_PENDING,
      message: `Gia sư ${tutorName} muốn nhận lớp ${classItem.classCode} - Môn: ${classItem.subject}`,
    }),
  );
  await Promise.all(notifyAdmins);

  return ClassApplicationMapper.toDTO(application);
};

module.exports = { applyForClass };
