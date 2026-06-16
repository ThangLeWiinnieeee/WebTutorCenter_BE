const AppError = require("../utils/AppError");
const HTTP_STATUS = require("../constants/status");
const locationRepository = require("../repositories/location.repository");
const classRepository = require("../repositories/class.repository");
const { ClassMapper } = require("../mappers");
const MESSAGE = require("../constants/message");
const { SUBJECTS } = require("../constants/tutor");
const classPricingRepository = require("../repositories/class.pricing.repository");

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

const generateClassCode = async () => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const classCode = String(Math.floor(10000 + Math.random() * 90000));
    const exists = await classRepository.findByClassCode(classCode);
    if (!exists) return classCode;
  }
  throw new AppError("Không thể tạo mã lớp, vui lòng thử lại", HTTP_STATUS.INTERNAL_SERVER_ERROR);
};

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
  await ensureLocationValid(payload.provinceCode, payload.districtCode);
  const configDoc = await loadPricingConfigDoc();
  ensurePricingInputValid(payload, configDoc);
  const pricing = calculateFee(payload, configDoc);
  const classCode = await generateClassCode();
  return {
    ...payload,
    promoCode: payload.promoCode || null,
    classCode,
    createdBy: userId,
    ...pricing,
  };
};

const quoteClass = async (payload) => {
  await ensureLocationValid(payload.provinceCode, payload.districtCode);
  const configDoc = await loadPricingConfigDoc();
  ensurePricingInputValid(payload, configDoc);
  return calculateFee(payload, configDoc);
};

const createClass = async (payload, userId) => {
  const data = await buildClassData(payload, userId);
  const created = await classRepository.create(data);
  return ClassMapper.toDTO(created);
};

const normalizeSubjectFilter = (subject) => {
  if (!subject) return "";
  const normalized = subject.trim().toLowerCase();
  const matchedSubject = SUBJECTS.find((item) => item.toLowerCase() === normalized);
  return matchedSubject || subject.trim();
};

const getClasses = async (query) => {
  const filters = {};
  if (query.subject) filters.subject = normalizeSubjectFilter(query.subject);
  if (query.provinceCode) filters.provinceCode = query.provinceCode;
  if (query.districtCode) filters.districtCode = query.districtCode;

  const page = query.page || 1;
  const limit = query.limit || 6;
  const { classes, totalItems } = await classRepository.findMany(filters, { page, limit });
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  return {
    classes: ClassMapper.toDTOs(classes),
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

const getClassById = async (id) => {
  const classItem = await classRepository.findById(id);
  if (!classItem) {
    throw new AppError(MESSAGE.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  return ClassMapper.toDTO(classItem);
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
  getClassById,
  getSubjects,
  getPricingConfig,
  clearPricingConfigCache,
};
