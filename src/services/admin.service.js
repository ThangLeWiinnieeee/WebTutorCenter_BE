const userRepository = require("../repositories/user.repository");
const tutorRepository = require("../repositories/tutor.repository");
const classRepository = require("../repositories/class.repository");
const promoRepository = require("../repositories/promo.repository");
const classApplicationRepository = require("../repositories/class.application.repository");
const notificationService = require("./notification.service");
const { NOTIFICATION_TYPES } = require("../models/notification.model");
const { CLASS_APPLICATION_STATUS } = require("../models/class.application.model");
const AppError = require("../utils/AppError");
const MESSAGE = require("../constants/message");
const HTTP_STATUS = require("../constants/status");
const ROLES = require("../constants/role");
const { TUTOR_STATUS } = require("../constants/tutor");
const { UserMapper, TutorMapper, ClassApplicationMapper, ClassMapper, PromoMapper } = require("../mappers");

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
  const [pendingCount, approvedCount, rejectedCount, pendingClassApplicationsCount] = await Promise.all([
    tutorRepository.countByStatus(TUTOR_STATUS.PENDING),
    tutorRepository.countByStatus(TUTOR_STATUS.APPROVED),
    tutorRepository.countByStatus(TUTOR_STATUS.REJECTED),
    classApplicationRepository.countPending(),
  ]);
  return { pendingCount, approvedCount, rejectedCount, pendingClassApplicationsCount };
};

// ──────────────────────────── Class application admin ────────────────────────────

const getClassApplications = async (query = {}) => {
  const applications = await classApplicationRepository.findByStatus(query.status);
  return ClassApplicationMapper.toDTOs(applications);
};

const getClassApplicationStats = async () => {
  return await classApplicationRepository.countAll();
};

const approveClassApplication = async (applicationId) => {
  const application = await classApplicationRepository.findById(applicationId);
  if (!application) throw new AppError(MESSAGE.CLASS_APPLICATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  if (application.status !== CLASS_APPLICATION_STATUS.PENDING) {
    throw new AppError(MESSAGE.CLASS_APPLICATION_NOT_PENDING, HTTP_STATUS.BAD_REQUEST);
  }

  const updated = await classApplicationRepository.update(applicationId, {
    status: CLASS_APPLICATION_STATUS.APPROVED,
  });

  const tutor = application.tutorId;
  const tutorUserId = tutor.userId?._id ?? tutor.userId;
  const classItem = application.classId;

  await Promise.all([
    notificationService.createNotification({
      userId: tutorUserId,
      type: NOTIFICATION_TYPES.CLASS_APPLICATION_APPROVED,
      message: `Chúc mừng! Bạn đã được duyệt nhận lớp ${classItem.classCode} - Môn: ${classItem.subject}. Admin sẽ liên hệ sớm để xác nhận thông tin.`,
    }),
    tutorRepository.update(tutor._id, {
      $inc: { totalClassesAccepted: 1, classesAcceptedThisMonth: 1 },
    }),
  ]);

  return ClassApplicationMapper.toDTO(updated);
};

const rejectClassApplication = async (applicationId, rejectionReason) => {
  const application = await classApplicationRepository.findById(applicationId);
  if (!application) throw new AppError(MESSAGE.CLASS_APPLICATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  if (application.status !== CLASS_APPLICATION_STATUS.PENDING) {
    throw new AppError(MESSAGE.CLASS_APPLICATION_NOT_PENDING, HTTP_STATUS.BAD_REQUEST);
  }

  const updated = await classApplicationRepository.update(applicationId, {
    status: CLASS_APPLICATION_STATUS.REJECTED,
    rejectionReason,
  });

  const tutor = application.tutorId;
  const tutorUserId = tutor.userId?._id ?? tutor.userId;
  const classItem = application.classId;

  await notificationService.createNotification({
    userId: tutorUserId,
    type: NOTIFICATION_TYPES.CLASS_APPLICATION_REJECTED,
    message: `Yêu cầu nhận lớp ${classItem.classCode} (Môn: ${classItem.subject}) của bạn đã bị từ chối. Lý do: ${rejectionReason}`,
  });

  return ClassApplicationMapper.toDTO(updated);
};

// ──────────────────────────── Class (bài đăng tìm gia sư) admin ────────────────────────────

const buildClassFilters = ({ keyword, subject }) => {
  const filters = {};
  if (keyword) {
    const pattern = new RegExp(escapeRegExp(keyword.trim()), "i");
    filters.$or = [{ classCode: pattern }, { summary: pattern }, { contactPhone: pattern }];
  }
  if (subject) filters.subject = subject;
  return filters;
};

// Gắn số đơn nhận lớp vào mỗi bài đăng để admin nắm tình hình
const attachApplicationCounts = async (dtos) => {
  const ids = dtos.map((dto) => dto.id);
  const countMap = await classApplicationRepository.countByClassIds(ids);
  return dtos.map((dto) => ({ ...dto, applicationsCount: countMap[String(dto.id)] || 0 }));
};

const getAdminClasses = async (query = {}) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const filters = buildClassFilters(query);
  const { classes, totalItems } = await classRepository.findManyForAdmin(filters, { page, limit });
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const dtos = await attachApplicationCounts(ClassMapper.toDTOs(classes));
  return {
    classes: dtos,
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

const getAdminClassDetail = async (classId) => {
  const classItem = await classRepository.findByIdPopulated(classId);
  if (!classItem) throw new AppError(MESSAGE.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  const dto = ClassMapper.toDTO(classItem);
  const applicationsCount = await classApplicationRepository.countByClassId(classId);
  return { ...dto, applicationsCount };
};

// Xóa mềm: đưa bài đăng vào thùng rác (giữ đơn nhận lớp; chỉ xóa khi xóa vĩnh viễn)
const deleteAdminClass = async (classId, adminUserId) => {
  const deleted = await classRepository.softDelete(classId, adminUserId);
  if (!deleted) throw new AppError(MESSAGE.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  return { id: classId };
};

// ──────────────────────────── Thùng rác (soft-delete) ────────────────────────────

// Đăng ký xử lý cho từng loại dữ liệu có thể nằm trong thùng rác
const TRASH_ENTITIES = {
  users: {
    label: "Người dùng",
    list: async ({ page, limit }) => {
      const { users, totalItems } = await userRepository.findDeleted({ page, limit });
      return { items: UserMapper.toDTOs(users), totalItems };
    },
    restore: (id) => userRepository.restore(id),
    purge: (id) => userRepository.hardDelete(id),
  },
  classes: {
    label: "Bài đăng",
    list: async ({ page, limit }) => {
      const { classes, totalItems } = await classRepository.findDeleted({ page, limit });
      return { items: ClassMapper.toDTOs(classes), totalItems };
    },
    restore: (id) => classRepository.restore(id),
    // Xóa vĩnh viễn bài đăng kèm các đơn nhận lớp liên quan
    purge: async (id) => {
      const purged = await classRepository.deleteById(id);
      if (purged) await classApplicationRepository.deleteByClassId(id);
      return purged;
    },
  },
  promos: {
    label: "Mã ưu đãi",
    list: async ({ page, limit }) => {
      const { items, totalItems } = await promoRepository.findDeleted({ page, limit });
      return { items: PromoMapper.toDTOs(items), totalItems };
    },
    restore: (id) => promoRepository.restore(id),
    purge: (id) => promoRepository.deleteById(id),
  },
};

const getTrashEntity = (type) => {
  const entity = TRASH_ENTITIES[type];
  if (!entity) throw new AppError("Loại dữ liệu không hợp lệ", HTTP_STATUS.BAD_REQUEST);
  return entity;
};

const getTrashItems = async (type, query = {}) => {
  const entity = getTrashEntity(type);
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const { items, totalItems } = await entity.list({ page, limit });
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  return {
    type,
    items,
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

const restoreTrashItem = async (type, id) => {
  const entity = getTrashEntity(type);
  const restored = await entity.restore(id);
  if (!restored) throw new AppError("Không tìm thấy mục cần khôi phục", HTTP_STATUS.NOT_FOUND);
  return { id };
};

const purgeTrashItem = async (type, id) => {
  const entity = getTrashEntity(type);
  const purged = await entity.purge(id);
  if (!purged) throw new AppError("Không tìm thấy mục cần xóa", HTTP_STATUS.NOT_FOUND);
  return { id };
};

const getTrashCounts = async () => {
  const [users, classes, promos] = await Promise.all([
    userRepository.findDeleted({ page: 1, limit: 1 }),
    classRepository.findDeleted({ page: 1, limit: 1 }),
    promoRepository.findDeleted({ page: 1, limit: 1 }),
  ]);
  return {
    users: users.totalItems,
    classes: classes.totalItems,
    promos: promos.totalItems,
  };
};

module.exports = {
  getAdminUsers,
  updateAdminUser,
  updateAdminUserStatus,
  softDeleteAdminUser,
  getAdminClasses,
  getAdminClassDetail,
  deleteAdminClass,
  getTrashItems,
  restoreTrashItem,
  purgeTrashItem,
  getTrashCounts,
  getPendingTutors,
  approveTutor,
  rejectTutor,
  getDashboardStats,
  getClassApplications,
  getClassApplicationStats,
  approveClassApplication,
  rejectClassApplication,
};
