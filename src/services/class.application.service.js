const AppError = require("../utils/AppError");
const HTTP_STATUS = require("../constants/status");
const MESSAGE = require("../constants/message");
const { TUTOR_STATUS } = require("../constants/tutor");
const ROLES = require("../constants/role");
const { NOTIFICATION_TYPES } = require("../models/notification.model");
const { CLASS_APPLICATION_STATUS } = require("../models/class.application.model");
const { CLASS_STATUS } = require("../models/class.model");
const classRepository = require("../repositories/class.repository");
const classApplicationRepository = require("../repositories/class.application.repository");
const tutorRepository = require("../repositories/tutor.repository");
const userRepository = require("../repositories/user.repository");
const notificationService = require("./notification.service");
const { ClassApplicationMapper } = require("../mappers");
const { buildPagination } = require("../utils/pagination");

const applyForClass = async (userId, classId) => {
  const classItem = await classRepository.findById(classId);
  if (!classItem) throw new AppError(MESSAGE.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  // Lớp đã có gia sư nhận hoặc đã hết hạn thì không cho nhận nữa
  if (classItem.status && classItem.status !== CLASS_STATUS.OPEN) {
    throw new AppError(
      "Lớp này không còn nhận đăng ký (đã có gia sư hoặc đã hết hạn).",
      HTTP_STATUS.CONFLICT,
    );
  }

  // Không cho phép nhận lớp do chính mình đăng
  if (classItem.createdBy?.toString() === String(userId)) {
    throw new AppError(MESSAGE.CLASS_APPLICATION_OWN_CLASS, HTTP_STATUS.FORBIDDEN);
  }

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

  // Luồng mới: đơn ứng tuyển gửi tới NGƯỜI ĐĂNG (để họ chọn gia sư), không gửi thẳng admin.
  const tutorUser = await userRepository.findById(userId);
  const tutorName = tutorUser?.fullName || "Gia sư";
  const posterUserId = classItem.createdBy;
  if (posterUserId) {
    await notificationService.createNotification({
      userId: posterUserId,
      type: NOTIFICATION_TYPES.CLASS_APPLICATION_PENDING,
      message: `Gia sư ${tutorName} vừa ứng tuyển lớp ${classItem.classCode} - Môn: ${classItem.subject}. Vào "Bài đăng của tôi" để chọn gia sư.`,
    });
  }

  return ClassApplicationMapper.toDTO(application);
};

// Người đăng xem danh sách gia sư ứng tuyển bài đăng của mình (sắp theo số lớp đã dạy giảm dần).
const getApplicantsForPoster = async (userId, classId) => {
  const classItem = await classRepository.findById(classId);
  if (!classItem) throw new AppError(MESSAGE.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  if (String(classItem.createdBy) !== String(userId)) {
    throw new AppError(MESSAGE.CLASS_APPLICANT_NOT_OWNER, HTTP_STATUS.FORBIDDEN);
  }

  const docs = await classApplicationRepository.findApplicantsByClassId(classId);
  return {
    classItem: {
      id: classItem._id,
      classCode: classItem.classCode,
      subject: classItem.subject,
      status: classItem.status || "open",
    },
    applicants: ClassApplicationMapper.toApplicantDTOs(docs),
  };
};

// Người đăng chọn 1 gia sư từ danh sách ứng tuyển → chuyển sang SELECTED, gửi admin duyệt.
const selectApplicant = async (userId, classId, applicationId) => {
  const classItem = await classRepository.findById(classId);
  if (!classItem) throw new AppError(MESSAGE.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  if (String(classItem.createdBy) !== String(userId)) {
    throw new AppError(MESSAGE.CLASS_APPLICANT_NOT_OWNER, HTTP_STATUS.FORBIDDEN);
  }

  if (classItem.status && classItem.status !== CLASS_STATUS.OPEN) {
    throw new AppError(MESSAGE.CLASS_APPLICANT_CLASS_NOT_OPEN, HTTP_STATUS.CONFLICT);
  }

  const application = await classApplicationRepository.findById(applicationId);
  const appClassId = application?.classId?._id ?? application?.classId;
  if (!application || String(appClassId) !== String(classId)) {
    throw new AppError(MESSAGE.CLASS_APPLICATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  if (application.status !== CLASS_APPLICATION_STATUS.PENDING) {
    throw new AppError(MESSAGE.CLASS_APPLICANT_NOT_PENDING, HTTP_STATUS.BAD_REQUEST);
  }

  // Nếu trước đó đã chọn gia sư khác (selected) → đưa họ về lại pending để chọn lại linh hoạt
  await classApplicationRepository.resetOtherSelectedToPending(classId, applicationId);
  const updated = await classApplicationRepository.update(applicationId, {
    status: CLASS_APPLICATION_STATUS.SELECTED,
  });

  const tutor = application.tutorId;
  const tutorUserId = tutor.userId?._id ?? tutor.userId;
  const tutorName = tutor.userId?.fullName || "Gia sư";

  await Promise.all([
    notificationService.createNotification({
      userId: tutorUserId,
      type: NOTIFICATION_TYPES.CLASS_APPLICATION_SELECTED,
      message: `Bạn đã được người đăng chọn cho lớp ${classItem.classCode} - Môn: ${classItem.subject}. Đang chờ admin duyệt.`,
    }),
    notifyAdmins(
      NOTIFICATION_TYPES.CLASS_APPLICATION_SELECTED,
      `Người đăng đã chọn gia sư ${tutorName} cho lớp ${classItem.classCode} - Môn: ${classItem.subject}. Vui lòng duyệt lớp.`,
    ),
  ]);

  return ClassApplicationMapper.toDTO(updated);
};

const getMyApplications = async (userId, query = {}) => {
  const tutor = await tutorRepository.findByUserId(userId);
  if (!tutor) throw new AppError(MESSAGE.TUTOR_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const status = query.status && query.status !== "all" ? query.status : null;

  const [docs, grouped] = await Promise.all([
    classApplicationRepository.findByTutorIdPage(tutor._id, { status, page, limit }),
    classApplicationRepository.countByTutorIdGrouped(tutor._id),
  ]);

  const counts = {
    all:
      grouped.pending +
      grouped.selected +
      grouped.approved +
      grouped.rejected +
      grouped.not_selected +
      grouped.cancel_requested +
      grouped.cancelled,
    pending: grouped.pending,
    selected: grouped.selected,
    approved: grouped.approved,
    rejected: grouped.rejected,
    not_selected: grouped.not_selected,
    cancel_requested: grouped.cancel_requested,
    cancelled: grouped.cancelled,
  };
  const totalItems = status ? counts[status] ?? 0 : counts.all;

  return {
    applications: ClassApplicationMapper.toMineDTOs(docs),
    pagination: buildPagination({ page, limit, totalItems }),
    counts,
  };
};

const notifyAdmins = async (type, message) => {
  const admins = await userRepository.findAllByRole(ROLES.ADMIN);
  await Promise.all(
    admins.map((admin) =>
      notificationService.createNotification({ userId: admin._id, type, message })
    )
  );
};

// Gia sư rút/hủy đơn nhận lớp.
// - Đơn pending: hủy ngay (cancelled).
// - Đơn approved: tạo yêu cầu hủy (cancel_requested) chờ admin duyệt.
const cancelApplication = async (userId, applicationId, reason) => {
  const application = await classApplicationRepository.findById(applicationId);
  if (!application) throw new AppError(MESSAGE.CLASS_APPLICATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  // Đơn phải thuộc về gia sư đang đăng nhập
  const tutorUserId = application.tutorId?.userId?._id ?? application.tutorId?.userId;
  if (String(tutorUserId) !== String(userId)) {
    throw new AppError(MESSAGE.CLASS_APPLICATION_NOT_FOUND, HTTP_STATUS.FORBIDDEN);
  }

  const classItem = application.classId;

  if (application.status === CLASS_APPLICATION_STATUS.PENDING) {
    const updated = await classApplicationRepository.update(applicationId, {
      status: CLASS_APPLICATION_STATUS.CANCELLED,
      cancellationReason: reason,
    });
    await notifyAdmins(
      NOTIFICATION_TYPES.CLASS_APPLICATION_CANCELLED,
      `Gia sư đã hủy đơn nhận lớp ${classItem.classCode} (Môn: ${classItem.subject}).`
    );
    return ClassApplicationMapper.toDTO(updated);
  }

  if (application.status === CLASS_APPLICATION_STATUS.APPROVED) {
    const updated = await classApplicationRepository.update(applicationId, {
      status: CLASS_APPLICATION_STATUS.CANCEL_REQUESTED,
      cancellationReason: reason,
    });
    await notifyAdmins(
      NOTIFICATION_TYPES.CLASS_APPLICATION_CANCEL_REQUESTED,
      `Gia sư xin hủy lớp đã nhận ${classItem.classCode} (Môn: ${classItem.subject}), cần được duyệt.`
    );
    return ClassApplicationMapper.toDTO(updated);
  }

  throw new AppError(MESSAGE.CLASS_APPLICATION_CANCEL_INVALID_STATUS, HTTP_STATUS.BAD_REQUEST);
};

module.exports = {
  applyForClass,
  getApplicantsForPoster,
  selectApplicant,
  getMyApplications,
  cancelApplication,
};
