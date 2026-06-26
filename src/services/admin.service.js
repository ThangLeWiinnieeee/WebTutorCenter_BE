const userRepository = require("../repositories/user.repository");
const tutorRepository = require("../repositories/tutor.repository");
const classRepository = require("../repositories/class.repository");
const promoRepository = require("../repositories/promo.repository");
const classApplicationRepository = require("../repositories/class.application.repository");
const profileChangeRequestRepository = require("../repositories/profileChangeRequest.repository");
const reviewRepository = require("../repositories/review.repository");
const reviewService = require("./review.service");
const notificationService = require("./notification.service");
const { NOTIFICATION_TYPES } = require("../models/notification.model");
const { CLASS_APPLICATION_STATUS } = require("../models/class.application.model");
const { CLASS_STATUS } = require("../models/class.model");
const { PROFILE_CHANGE_STATUS } = require("../models/profileChangeRequest.model");
const AppError = require("../utils/AppError");
const MESSAGE = require("../constants/message");
const HTTP_STATUS = require("../constants/status");
const ROLES = require("../constants/role");
const { TUTOR_STATUS } = require("../constants/tutor");
const {
  UserMapper,
  TutorMapper,
  ClassApplicationMapper,
  ClassMapper,
  PromoMapper,
  ProfileChangeRequestMapper,
  ReviewMapper,
} = require("../mappers");
const { buildPagination } = require("../utils/pagination");

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
  return {
    users: UserMapper.toDTOs(users),
    pagination: buildPagination({ page, limit, totalItems }),
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

const getPendingTutors = async (query = {}) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const [tutors, totalItems] = await Promise.all([
    tutorRepository.findPendingPage({ page, limit }),
    tutorRepository.countByStatus(TUTOR_STATUS.PENDING),
  ]);
  return {
    tutors: await TutorMapper.toDTOList(tutors),
    pagination: buildPagination({ page, limit, totalItems }),
  };
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
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const status = query.status && query.status !== "all" ? query.status : null;

  const [docs, grouped] = await Promise.all([
    classApplicationRepository.findByStatusPage({ status, page, limit }),
    classApplicationRepository.countAll(),
  ]);

  const counts = {
    all: grouped.pending + grouped.selected + grouped.approved + grouped.rejected,
    pending: grouped.pending,
    selected: grouped.selected,
    approved: grouped.approved,
    rejected: grouped.rejected,
  };
  const totalItems = status ? counts[status] ?? 0 : counts.all;

  return {
    applications: ClassApplicationMapper.toDTOs(docs),
    pagination: buildPagination({ page, limit, totalItems }),
    counts,
  };
};

const getClassApplicationStats = async () => {
  return await classApplicationRepository.countAll();
};

const approveClassApplication = async (applicationId) => {
  const application = await classApplicationRepository.findById(applicationId);
  if (!application) throw new AppError(MESSAGE.CLASS_APPLICATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  // Admin chỉ duyệt gia sư đã được người đăng chọn (selected)
  if (application.status !== CLASS_APPLICATION_STATUS.SELECTED) {
    throw new AppError(MESSAGE.CLASS_APPLICATION_NOT_SELECTED_STATUS, HTTP_STATUS.BAD_REQUEST);
  }

  const updated = await classApplicationRepository.update(applicationId, {
    status: CLASS_APPLICATION_STATUS.APPROVED,
  });

  const tutor = application.tutorId;
  const tutorUserId = tutor.userId?._id ?? tutor.userId;
  const classItem = application.classId;
  const posterUserId = classItem.createdBy?._id ?? classItem.createdBy;

  // Các gia sư ứng tuyển còn lại của lớp → "không được chọn" + báo cho họ
  const peers = await classApplicationRepository.findPeersToReject(classItem._id, applicationId);

  await Promise.all([
    // Lớp chuyển sang "đã ghép" → ẩn khỏi feed/danh sách, vẫn còn trong "bài đăng của tôi"
    classRepository.updateStatus(classItem._id, CLASS_STATUS.MATCHED),
    notificationService.createNotification({
      userId: tutorUserId,
      type: NOTIFICATION_TYPES.CLASS_APPLICATION_APPROVED,
      message: `Chúc mừng! Bạn đã được duyệt nhận lớp ${classItem.classCode} - Môn: ${classItem.subject}. Admin sẽ liên hệ sớm để xác nhận thông tin.`,
    }),
    // Báo cho người đăng rằng đã có gia sư nhận lớp
    posterUserId &&
      notificationService.createNotification({
        userId: posterUserId,
        type: NOTIFICATION_TYPES.CLASS_MATCHED,
        message: `Lớp ${classItem.classCode} (Môn: ${classItem.subject}) của bạn đã có gia sư nhận. Gia sư sẽ liên hệ với bạn trong thời gian sắp tới.`,
      }),
    tutorRepository.update(tutor._id, {
      $inc: { totalClassesAccepted: 1, classesAcceptedThisMonth: 1 },
    }),
    // Loại các ứng viên còn lại + thông báo
    classApplicationRepository.markNotSelected(peers.map((p) => p._id)),
    ...peers.map((p) =>
      notificationService.createNotification({
        userId: p.tutorId?.userId?._id ?? p.tutorId?.userId,
        type: NOTIFICATION_TYPES.CLASS_APPLICATION_NOT_SELECTED,
        message: `Lớp ${classItem.classCode} - Môn: ${classItem.subject} đã chọn gia sư khác. Cảm ơn bạn đã ứng tuyển.`,
      }),
    ),
  ]);

  return ClassApplicationMapper.toDTO(updated);
};

const rejectClassApplication = async (applicationId, rejectionReason) => {
  const application = await classApplicationRepository.findById(applicationId);
  if (!application) throw new AppError(MESSAGE.CLASS_APPLICATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  // Admin chỉ từ chối gia sư đã được người đăng chọn (selected)
  if (application.status !== CLASS_APPLICATION_STATUS.SELECTED) {
    throw new AppError(MESSAGE.CLASS_APPLICATION_NOT_SELECTED_STATUS, HTTP_STATUS.BAD_REQUEST);
  }

  const updated = await classApplicationRepository.update(applicationId, {
    status: CLASS_APPLICATION_STATUS.REJECTED,
    rejectionReason,
  });

  const tutor = application.tutorId;
  const tutorUserId = tutor.userId?._id ?? tutor.userId;
  const classItem = application.classId;
  const posterUserId = classItem.createdBy?._id ?? classItem.createdBy;

  await Promise.all([
    notificationService.createNotification({
      userId: tutorUserId,
      type: NOTIFICATION_TYPES.CLASS_APPLICATION_REJECTED,
      message: `Yêu cầu nhận lớp ${classItem.classCode} (Môn: ${classItem.subject}) của bạn đã bị từ chối. Lý do: ${rejectionReason}`,
    }),
    // Báo người đăng để chọn lại gia sư khác (các ứng viên còn lại vẫn ở trạng thái chờ)
    posterUserId &&
      notificationService.createNotification({
        userId: posterUserId,
        type: NOTIFICATION_TYPES.CLASS_APPLICATION_REJECTED,
        message: `Gia sư bạn chọn cho lớp ${classItem.classCode} (Môn: ${classItem.subject}) đã bị admin từ chối. Vui lòng chọn gia sư khác trong danh sách ứng tuyển.`,
      }),
  ]);

  return ClassApplicationMapper.toDTO(updated);
};

// ──────────────────────────── Hủy đơn nhận lớp (gia sư rút đơn) ────────────────────────────

const getApplicationCancellations = async (query = {}) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const status = query.status && query.status !== "all" ? query.status : null;

  const [docs, grouped] = await Promise.all([
    classApplicationRepository.findCancellationsPage({ status, page, limit }),
    classApplicationRepository.countCancellationsGrouped(),
  ]);

  const counts = {
    all: grouped.cancel_requested + grouped.cancelled,
    cancel_requested: grouped.cancel_requested,
    cancelled: grouped.cancelled,
  };
  const totalItems = status ? counts[status] ?? 0 : counts.all;

  return {
    cancellations: ClassApplicationMapper.toDTOs(docs),
    pagination: buildPagination({ page, limit, totalItems }),
    counts,
  };
};

const approveCancellation = async (applicationId) => {
  const application = await classApplicationRepository.findById(applicationId);
  if (!application) throw new AppError(MESSAGE.CLASS_APPLICATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  if (application.status !== CLASS_APPLICATION_STATUS.CANCEL_REQUESTED) {
    throw new AppError(MESSAGE.CLASS_APPLICATION_CANCEL_NOT_REQUESTED, HTTP_STATUS.BAD_REQUEST);
  }

  const updated = await classApplicationRepository.update(applicationId, {
    status: CLASS_APPLICATION_STATUS.CANCELLED,
  });

  const tutor = application.tutorId;
  const tutorUserId = tutor.userId?._id ?? tutor.userId;
  const classItem = application.classId;

  // Gia sư rút lớp đã nhận → mở lại cho người khác nếu chưa tới giờ học, ngược lại đánh dấu hết hạn.
  // Reset cờ hoàn thành vì gia sư đã thay đổi.
  const stillUpcoming = classItem.startDate && new Date(classItem.startDate) > new Date();
  await classRepository.update(classItem._id, {
    status: stillUpcoming ? CLASS_STATUS.OPEN : CLASS_STATUS.EXPIRED,
    completedByPoster: false,
    completedByTutor: false,
    completedAt: null,
  });

  // Trừ lại thống kê đã cộng khi duyệt nhận lớp (clamp ≥ 0)
  await tutorRepository.update(tutor._id, {
    totalClassesAccepted: Math.max(0, (tutor.totalClassesAccepted || 0) - 1),
    classesAcceptedThisMonth: Math.max(0, (tutor.classesAcceptedThisMonth || 0) - 1),
  });

  await notificationService.createNotification({
    userId: tutorUserId,
    type: NOTIFICATION_TYPES.CLASS_APPLICATION_CANCEL_APPROVED,
    message: `Yêu cầu hủy lớp ${classItem.classCode} (Môn: ${classItem.subject}) của bạn đã được duyệt.`,
  });

  return ClassApplicationMapper.toDTO(updated);
};

const rejectCancellation = async (applicationId, reason) => {
  const application = await classApplicationRepository.findById(applicationId);
  if (!application) throw new AppError(MESSAGE.CLASS_APPLICATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  if (application.status !== CLASS_APPLICATION_STATUS.CANCEL_REQUESTED) {
    throw new AppError(MESSAGE.CLASS_APPLICATION_CANCEL_NOT_REQUESTED, HTTP_STATUS.BAD_REQUEST);
  }

  const updated = await classApplicationRepository.update(applicationId, {
    status: CLASS_APPLICATION_STATUS.APPROVED,
    cancellationReason: null,
  });

  const tutor = application.tutorId;
  const tutorUserId = tutor.userId?._id ?? tutor.userId;
  const classItem = application.classId;

  const reasonText = reason ? ` Lý do: ${reason}` : "";
  await notificationService.createNotification({
    userId: tutorUserId,
    type: NOTIFICATION_TYPES.CLASS_APPLICATION_CANCEL_REJECTED,
    message: `Yêu cầu hủy lớp ${classItem.classCode} (Môn: ${classItem.subject}) đã bị từ chối, bạn vẫn nhận lớp này.${reasonText}`,
  });

  return ClassApplicationMapper.toDTO(updated);
};

// ──────────────────────────── Profile change request admin (gia sư đổi hồ sơ) ────────────────────────────

const getProfileChangeRequests = async (query = {}) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const status = query.status && query.status !== "all" ? query.status : null;

  const [docs, grouped] = await Promise.all([
    profileChangeRequestRepository.findPage({ status, page, limit }),
    profileChangeRequestRepository.countGrouped(),
  ]);

  const counts = {
    all: grouped.pending + grouped.approved + grouped.rejected,
    pending: grouped.pending,
    approved: grouped.approved,
    rejected: grouped.rejected,
  };
  const totalItems = status ? counts[status] ?? 0 : counts.all;

  return {
    requests: await ProfileChangeRequestMapper.toDTOList(docs),
    pagination: buildPagination({ page, limit, totalItems }),
    counts,
  };
};

const approveProfileChange = async (requestId, adminUserId) => {
  const request = await profileChangeRequestRepository.findById(requestId);
  if (!request) throw new AppError(MESSAGE.PROFILE_CHANGE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  if (request.status !== PROFILE_CHANGE_STATUS.PENDING) {
    throw new AppError(MESSAGE.PROFILE_CHANGE_NOT_PENDING, HTTP_STATUS.BAD_REQUEST);
  }

  const tutorId = request.tutorId?._id ?? request.tutorId;
  // Áp các thay đổi (đã whitelist khi tạo) vào hồ sơ gia sư
  await tutorRepository.update(tutorId, request.changes);

  const updated = await profileChangeRequestRepository.update(requestId, {
    status: PROFILE_CHANGE_STATUS.APPROVED,
    reviewedBy: adminUserId,
    reviewedAt: new Date(),
  });

  const tutorUserId = request.userId?._id ?? request.userId;
  await notificationService.createNotification({
    userId: tutorUserId,
    type: NOTIFICATION_TYPES.PROFILE_CHANGE_APPROVED,
    message: "Yêu cầu đổi thông tin hồ sơ của bạn đã được duyệt và cập nhật.",
  });

  return ProfileChangeRequestMapper.toDTO(updated);
};

const rejectProfileChange = async (requestId, rejectionReason, adminUserId) => {
  const request = await profileChangeRequestRepository.findById(requestId);
  if (!request) throw new AppError(MESSAGE.PROFILE_CHANGE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  if (request.status !== PROFILE_CHANGE_STATUS.PENDING) {
    throw new AppError(MESSAGE.PROFILE_CHANGE_NOT_PENDING, HTTP_STATUS.BAD_REQUEST);
  }

  const updated = await profileChangeRequestRepository.update(requestId, {
    status: PROFILE_CHANGE_STATUS.REJECTED,
    rejectionReason,
    reviewedBy: adminUserId,
    reviewedAt: new Date(),
  });

  const tutorUserId = request.userId?._id ?? request.userId;
  await notificationService.createNotification({
    userId: tutorUserId,
    type: NOTIFICATION_TYPES.PROFILE_CHANGE_REJECTED,
    message: `Yêu cầu đổi thông tin hồ sơ của bạn đã bị từ chối. Lý do: ${rejectionReason}`,
  });

  return ProfileChangeRequestMapper.toDTO(updated);
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
  const dtos = await attachApplicationCounts(ClassMapper.toDTOs(classes));
  return {
    classes: dtos,
    pagination: buildPagination({ page, limit, totalItems }),
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
  reviews: {
    label: "Đánh giá",
    list: async ({ page, limit }) => {
      const { items, totalItems } = await reviewRepository.findDeleted({ page, limit });
      return { items: ReviewMapper.toTrashDTOs(items), totalItems };
    },
    // Khôi phục đánh giá → tính lại điểm trung bình của gia sư
    restore: async (id) => {
      const restored = await reviewRepository.restore(id);
      if (restored) await reviewService.recomputeTutorRating(restored.tutorId);
      return restored;
    },
    purge: (id) => reviewRepository.deleteById(id),
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
  return {
    type,
    items,
    pagination: buildPagination({ page, limit, totalItems }),
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
  const [users, classes, promos, reviews] = await Promise.all([
    userRepository.findDeleted({ page: 1, limit: 1 }),
    classRepository.findDeleted({ page: 1, limit: 1 }),
    promoRepository.findDeleted({ page: 1, limit: 1 }),
    reviewRepository.findDeleted({ page: 1, limit: 1 }),
  ]);
  return {
    users: users.totalItems,
    classes: classes.totalItems,
    promos: promos.totalItems,
    reviews: reviews.totalItems,
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
  getProfileChangeRequests,
  approveProfileChange,
  rejectProfileChange,
  getApplicationCancellations,
  approveCancellation,
  rejectCancellation,
};
