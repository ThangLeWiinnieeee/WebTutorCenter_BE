const AppError = require("../utils/AppError");
const HTTP_STATUS = require("../constants/status");
const locationRepository = require("../repositories/location.repository");
const classRepository = require("../repositories/class.repository");
const tutorRepository = require("../repositories/tutor.repository");
const classApplicationRepository = require("../repositories/class.application.repository");
const { ClassMapper } = require("../mappers");
const MESSAGE = require("../constants/message");
const { SUBJECTS } = require("../constants/tutor");
const classPricingRepository = require("../repositories/class.pricing.repository");
const promoService = require("./promo.service");
const promoRepository = require("../repositories/promo.repository");
const notificationService = require("./notification.service");
const { CLASS_STATUS } = require("../models/class.model");
const { NOTIFICATION_TYPES } = require("../models/notification.model");
const { buildPagination } = require("../helper/pagination.helper");
const { generateUniqueCode } = require("../helper/code.helper");

let cachedPricingConfig = null;
let pricingConfigCachedAt = 0;
const PRICING_CONFIG_CACHE_MS = 60_000;

const clearPricingConfigCache = () => {
  cachedPricingConfig = null;
  pricingConfigCachedAt = 0;
};

const loadPricingConfigDoc = async () => {
  const now = Date.now();
  if (cachedPricingConfig && now - pricingConfigCachedAt < PRICING_CONFIG_CACHE_MS) {
    return cachedPricingConfig;
  }

  const doc = await classPricingRepository.findDefault();
  if (!doc) {
    throw new AppError(MESSAGE.PRICING_CONFIG_MISSING, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  cachedPricingConfig = doc;
  pricingConfigCachedAt = now;
  return doc;
};

const mapBaseFeeBySubject = (baseFeeBySubject = []) => {
  const map = {};
  for (const item of baseFeeBySubject) {
    if (item?.subject) map[item.subject] = item.fee;
  }
  return map;
};

const toPricingConfigResponse = (doc) => {
  const minutesPerSessionOptions = [...(doc.minutesPerSessionOptions || [])].sort((a, b) => a - b);
  const defaultMinutesPerSession = minutesPerSessionOptions.includes(doc.sessionLengthBaseMinutes)
    ? doc.sessionLengthBaseMinutes
    : minutesPerSessionOptions[0] ?? doc.sessionLengthBaseMinutes;

  return {
    defaultBaseFee: doc.defaultBaseFee,
    studentCountSurcharge: doc.studentCountSurcharge,
    sessionLengthBaseMinutes: doc.sessionLengthBaseMinutes,
    minutesPerSessionOptions,
    defaultMinutesPerSession,
    sessionsPerWeekMin: doc.sessionsPerWeekMin,
    sessionsPerWeekMax: doc.sessionsPerWeekMax,
    baseFeeBySubject: mapBaseFeeBySubject(doc.baseFeeBySubject),
  };
};

const ensurePricingInputValid = (payload, configDoc) => {
  const options = configDoc.minutesPerSessionOptions || [];
  if (!options.includes(payload.minutesPerSession)) {
    throw new AppError(
      `Thời lượng mỗi buổi phải là một trong: ${options.join(", ")} phút`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (
    payload.sessionsPerWeek < configDoc.sessionsPerWeekMin ||
    payload.sessionsPerWeek > configDoc.sessionsPerWeekMax
  ) {
    throw new AppError(
      `Số buổi/tuần phải từ ${configDoc.sessionsPerWeekMin} đến ${configDoc.sessionsPerWeekMax}`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }
};

const generateClassCode = () =>
  generateUniqueCode({
    generate: () => String(Math.floor(10000 + Math.random() * 90000)),
    exists: (classCode) => classRepository.findByClassCode(classCode),
    errorMessage: "Không thể tạo mã lớp, vui lòng thử lại",
  });

const ensureLocationValid = async (provinceCode, districtCode) => {
  const [province, district] = await Promise.all([
    locationRepository.findProvinceByCode(provinceCode),
    locationRepository.findDistrictByCode(districtCode),
  ]);

  if (!province || !district || district.provinceCode !== provinceCode) {
    throw new AppError(MESSAGE.INVALID_AREA, HTTP_STATUS.BAD_REQUEST);
  }
};

const calculateFee = (payload, configDoc) => {
  const feeMap = mapBaseFeeBySubject(configDoc.baseFeeBySubject);
  const baseFee = feeMap[payload.subject] ?? configDoc.defaultBaseFee;
  const durationFactor = payload.minutesPerSession / configDoc.sessionLengthBaseMinutes;
  const studentSurcharge = Math.max(0, payload.studentCount - 1) * configDoc.studentCountSurcharge;
  const feePerSession = Math.round(baseFee * durationFactor + studentSurcharge);
  const feePerMonth = feePerSession * payload.sessionsPerWeek * 4;
  return { feePerSession, feePerMonth };
};

const buildClassData = async (payload, userId) => {
  const [province, district] = await Promise.all([
    locationRepository.findProvinceByCode(payload.provinceCode),
    locationRepository.findDistrictByCode(payload.districtCode),
  ]);

  if (!province || !district || district.provinceCode !== payload.provinceCode) {
    throw new AppError(MESSAGE.INVALID_AREA, HTTP_STATUS.BAD_REQUEST);
  }

  const configDoc = await loadPricingConfigDoc();
  ensurePricingInputValid(payload, configDoc);
  const pricing = calculateFee(payload, configDoc);
  const classCode = await generateClassCode();

  // Áp mã ưu đãi (nếu có) lên học phí/tháng — re-validate phía server để không tin client
  let promoCode = null;
  let promoDiscount = 0;
  let finalFeePerMonth = pricing.feePerMonth;
  let promoDoc = null;
  if (payload.promoCode) {
    const result = await promoService.evaluatePromo(payload.promoCode, pricing.feePerMonth, userId);
    promoDoc = result.promo;
    promoCode = result.promo.code;
    promoDiscount = result.discountAmount;
    finalFeePerMonth = result.finalAmount;
  }

  const data = {
    ...payload,
    promoCode,
    promoDiscount,
    classCode,
    provinceName: province.name,
    districtName: district.name,
    createdBy: userId,
    ...pricing,
    finalFeePerMonth,
  };

  return { data, promoDoc };
};

const quoteClass = async (payload) => {
  await ensureLocationValid(payload.provinceCode, payload.districtCode);
  const configDoc = await loadPricingConfigDoc();
  ensurePricingInputValid(payload, configDoc);
  return calculateFee(payload, configDoc);
};

const checkCanViewSensitiveDetails = async (classItem, user) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  const createdById = classItem.createdBy?._id || classItem.createdBy;
  if (createdById && createdById.toString() === user.id) return true;

  // Check if user is a tutor with an approved application for this class
  const tutor = await tutorRepository.findByUserId(user.id);
  if (tutor) {
    const approvedApp = await classApplicationRepository.findByClassAndTutor(classItem._id || classItem.id, tutor._id);
    if (approvedApp && approvedApp.status === "approved") return true;
  }

  return false;
};

const maskClassItem = async (classItem, user) => {
  const isArray = Array.isArray(classItem);
  const items = isArray ? classItem : [classItem];
  const maskedList = [];

  for (const item of items) {
    const dto = ClassMapper.toDTO(item);
    if (!dto) {
      maskedList.push(null);
      continue;
    }

    // Dynamic fallback for provinceName and districtName for older documents
    if (!dto.provinceName || !dto.districtName) {
      const [prov, dist] = await Promise.all([
        locationRepository.findProvinceByCode(dto.provinceCode),
        locationRepository.findDistrictByCode(dto.districtCode),
      ]);
      dto.provinceName = prov?.name || "";
      dto.districtName = dist?.name || "";
    }

    const canView = await checkCanViewSensitiveDetails(item, user);
    if (!canView) {
      dto.contactPhone = null;
      dto.locationLabel = `${dto.districtName}, ${dto.provinceName}`;
    }
    maskedList.push(dto);
  }

  return isArray ? maskedList : maskedList[0];
};

const createClass = async (payload, userId) => {
  const { data, promoDoc } = await buildClassData(payload, userId);
  const created = await classRepository.create(data);
  // Tăng số lượt đã dùng của mã sau khi tạo lớp thành công
  if (promoDoc?._id) {
    await promoRepository.incrementUsed(promoDoc._id);
  }
  return await maskClassItem(created, { id: userId });
};

const normalizeSubjectFilter = (subject) => {
  if (!subject) return "";
  const normalized = subject.trim().toLowerCase();
  const matchedSubject = SUBJECTS.find((item) => item.toLowerCase() === normalized);
  return matchedSubject || subject.trim();
};

const getClasses = async (query, user) => {
  const filters = {};
  if (query.subject) filters.subject = normalizeSubjectFilter(query.subject);
  if (query.provinceCode) filters.provinceCode = query.provinceCode;
  if (query.districtCode) filters.districtCode = query.districtCode;

  const page = query.page || 1;
  const limit = query.limit || 6;
  // Ẩn các lớp đã có gia sư nhận (đơn pending/approved/cancel_requested) khỏi danh sách công khai,
  // đồng bộ với feed "Lớp mới theo môn" — tránh nhiều gia sư cùng nhận một lớp.
  const excludeIds = await classApplicationRepository.distinctActiveClassIds();
  const { classes, totalItems } = await classRepository.findMany(filters, { page, limit, excludeIds });

  const maskedClasses = await maskClassItem(classes, user);
  return {
    classes: maskedClasses,
    pagination: buildPagination({ page, limit, totalItems }),
  };
};

const FEED_NEW_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 giờ

// Feed bài đăng tuyển gia sư theo đúng môn mà gia sư đăng ký dạy.
// Dùng truy vấn theo subject ($in tutor.subjects) thay vì tạo thông báo cho từng
// gia sư — đảm bảo mở rộng tốt khi có hàng nghìn bài đăng cùng môn.
const getClassFeedForTutor = async (userId, query = {}) => {
  const tutor = await tutorRepository.findByUserId(userId);
  if (!tutor) throw new AppError(MESSAGE.TUTOR_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const subjects = Array.isArray(tutor.subjects) ? tutor.subjects : [];
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const emptyPagination = buildPagination({ page, limit, totalItems: 0 });

  if (subjects.length === 0) {
    return { classes: [], subjects: [], newCount: 0, pagination: emptyPagination };
  }

  // Cho phép lọc theo 1 môn cụ thể, nhưng môn đó phải nằm trong các môn gia sư dạy
  const subjectFilter = query.subject && subjects.includes(query.subject) ? query.subject : null;
  const filterSubjects = subjectFilter ? [subjectFilter] : subjects;

  // Ẩn các bài đăng đã có gia sư nhận (đơn pending/approved)
  const excludeIds = await classApplicationRepository.distinctActiveClassIds();
  const since = new Date(Date.now() - FEED_NEW_WINDOW_MS);
  const [{ classes, totalItems }, newCount] = await Promise.all([
    classRepository.findBySubjects(filterSubjects, { page, limit, excludeIds }),
    classRepository.countBySubjectsSince(subjects, since, excludeIds),
  ]);

  const maskedClasses = await maskClassItem(classes, { id: userId, role: "tutor" });
  return {
    classes: maskedClasses,
    subjects,
    newCount,
    pagination: buildPagination({ page, limit, totalItems }),
  };
};

const getMyPostedClasses = async (userId, query = {}) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const { classes, totalItems } = await classRepository.findByCreatedBy(userId, { page, limit });

  // Đánh dấu bài đăng đã có đơn đang hoạt động → FE ẩn nút sửa/xóa cho khớp với ràng buộc backend
  const activeIds = new Set(
    (await classApplicationRepository.distinctActiveClassIds()).map(String),
  );
  const maskedClasses = await maskClassItem(classes, { id: userId });
  maskedClasses.forEach((item) => {
    if (item) item.hasActiveApplications = activeIds.has(String(item.id));
  });
  return {
    classes: maskedClasses,
    pagination: buildPagination({ page, limit, totalItems }),
  };
};

// Chủ bài đăng sửa bài của mình — chỉ khi đang mở và chưa có gia sư ứng tuyển.
const updatePostedClass = async (classId, userId, payload) => {
  const classItem = await classRepository.findById(classId);
  if (!classItem) throw new AppError(MESSAGE.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const ownerId = classItem.createdBy?._id ?? classItem.createdBy;
  if (String(ownerId) !== String(userId)) {
    throw new AppError("Bạn không có quyền sửa bài đăng này.", HTTP_STATUS.FORBIDDEN);
  }
  if (classItem.status !== CLASS_STATUS.OPEN) {
    throw new AppError("Chỉ có thể sửa bài đăng khi đang mở (chưa ghép gia sư).", HTTP_STATUS.BAD_REQUEST);
  }
  const activeCount = await classApplicationRepository.countActiveByClassId(classId);
  if (activeCount > 0) {
    throw new AppError(
      "Không thể sửa bài đăng khi đã có gia sư ứng tuyển. Vui lòng xử lý đơn trước.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  // Validate khu vực + tính lại học phí theo thông tin mới
  const [province, district] = await Promise.all([
    locationRepository.findProvinceByCode(payload.provinceCode),
    locationRepository.findDistrictByCode(payload.districtCode),
  ]);
  if (!province || !district || district.provinceCode !== payload.provinceCode) {
    throw new AppError(MESSAGE.INVALID_AREA, HTTP_STATUS.BAD_REQUEST);
  }
  const configDoc = await loadPricingConfigDoc();
  ensurePricingInputValid(payload, configDoc);
  const pricing = calculateFee(payload, configDoc);

  // Giữ nguyên mã ưu đãi ban đầu (không cho đổi khi sửa); tính lại số tiền giảm theo học phí mới
  let promoDiscount = 0;
  let finalFeePerMonth = pricing.feePerMonth;
  const promoCode = classItem.promoCode || null;
  if (promoCode) {
    const promo = await promoRepository.findByCode(promoCode);
    if (promo) {
      promoDiscount = promoService.computeDiscount(promo, pricing.feePerMonth);
      finalFeePerMonth = Math.max(0, pricing.feePerMonth - promoDiscount);
    }
  }

  const editable = { ...payload };
  delete editable.promoCode; // không cho sửa mã ưu đãi qua chức năng sửa bài

  const data = {
    ...editable,
    provinceName: province.name,
    districtName: district.name,
    ...pricing,
    promoCode,
    promoDiscount,
    finalFeePerMonth,
  };
  const updated = await classRepository.update(classId, data);
  return await maskClassItem(updated, { id: userId });
};

// Chủ bài đăng xóa VĨNH VIỄN bài của mình — chỉ khi chưa có đơn nào đang hoạt động.
const deletePostedClass = async (classId, userId) => {
  const classItem = await classRepository.findById(classId);
  if (!classItem) throw new AppError(MESSAGE.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const ownerId = classItem.createdBy?._id ?? classItem.createdBy;
  if (String(ownerId) !== String(userId)) {
    throw new AppError("Bạn không có quyền xóa bài đăng này.", HTTP_STATUS.FORBIDDEN);
  }
  const activeCount = await classApplicationRepository.countActiveByClassId(classId);
  if (activeCount > 0) {
    throw new AppError(
      "Không thể xóa bài đăng khi đã có gia sư ứng tuyển hoặc nhận lớp. Vui lòng liên hệ admin nếu cần.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }
  // Xóa hẳn khỏi DB kèm các đơn nhận lớp liên quan (không đưa vào thùng rác)
  await classApplicationRepository.deleteByClassId(classId);
  await classRepository.hardDelete(classId);
  return { id: classId };
};

const getClassById = async (id, user) => {
  const classItem = await classRepository.findById(id);
  if (!classItem) {
    throw new AppError(MESSAGE.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  return await maskClassItem(classItem, user);
};

// Người đăng / gia sư xác nhận đã hoàn thành lớp. Khi CẢ HAI xác nhận → lớp completed + tặng mã cho cả hai.
const confirmClassCompletion = async (userId, classId) => {
  const classItem = await classRepository.findById(classId);
  if (!classItem) throw new AppError(MESSAGE.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  if (classItem.status !== CLASS_STATUS.MATCHED) {
    throw new AppError("Chỉ lớp đã có gia sư nhận mới có thể xác nhận hoàn thành.", HTTP_STATUS.BAD_REQUEST);
  }

  const isPoster = String(classItem.createdBy) === String(userId);
  let approvedApp = null;
  let isTutor = false;
  if (!isPoster) {
    approvedApp = await classApplicationRepository.findApprovedByClassId(classId);
    const tutorUserId = approvedApp?.tutorId?.userId?._id ?? approvedApp?.tutorId?.userId;
    isTutor = Boolean(approvedApp) && String(tutorUserId) === String(userId);
  }
  if (!isPoster && !isTutor) {
    throw new AppError("Bạn không có quyền xác nhận hoàn thành lớp này.", HTTP_STATUS.FORBIDDEN);
  }

  const completedByPoster = Boolean(classItem.completedByPoster) || isPoster;
  const completedByTutor = Boolean(classItem.completedByTutor) || isTutor;
  const bothConfirmed = completedByPoster && completedByTutor;

  const update = { completedByPoster, completedByTutor };
  if (bothConfirmed) {
    update.status = CLASS_STATUS.COMPLETED;
    update.completedAt = new Date();
  }
  const updated = await classRepository.update(classId, update);

  if (bothConfirmed) {
    if (!approvedApp) approvedApp = await classApplicationRepository.findApprovedByClassId(classId);
    const tutorUserId = approvedApp?.tutorId?.userId?._id ?? approvedApp?.tutorId?.userId;
    const recipients = [classItem.createdBy, tutorUserId].filter(Boolean);

    await Promise.all(
      recipients.map(async (recipientId) => {
        const voucher = await promoService.generateRewardVoucher(recipientId, {
          classCode: classItem.classCode,
        });
        const expiry = new Date(voucher.expiresAt).toLocaleDateString("vi-VN");
        return notificationService.createNotification({
          userId: recipientId,
          type: NOTIFICATION_TYPES.CLASS_COMPLETED_REWARD,
          message: `Lớp ${classItem.classCode} (Môn: ${classItem.subject}) đã hoàn thành! Bạn nhận được mã giảm giá ${voucher.code} (giảm 10%, tối đa 200.000đ), hạn dùng đến ${expiry}. Xem trong "Kho mã giảm giá".`,
        });
      })
    );
  }

  return maskClassItem(updated, { id: userId });
};

const getSubjects = async () => {
  return SUBJECTS;
};

const getPricingConfig = async () => {
  const configDoc = await loadPricingConfigDoc();
  return toPricingConfigResponse(configDoc);
};

module.exports = {
  quoteClass,
  createClass,
  getClasses,
  getClassFeedForTutor,
  getMyPostedClasses,
  getClassById,
  updatePostedClass,
  deletePostedClass,
  confirmClassCompletion,
  getSubjects,
  getPricingConfig,
  clearPricingConfigCache,
};
