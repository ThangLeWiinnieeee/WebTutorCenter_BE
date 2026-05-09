const AppError = require("../../core/utils/AppError");
const HTTP_STATUS = require("../../core/constants/status");
const locationRepository = require("../locations/location.repository");
const classRepository = require("./class.repository");
const { MESSAGE } = require("./constants");
const {
  BASE_FEE_BY_SUBJECT,
  DEFAULT_BASE_FEE,
  STUDENT_COUNT_SURCHARGE,
  SESSION_LENGTH_BASE_MINUTES,
} = require("./class.pricing");
const { SUBJECTS } = require("./constants");

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

const calculateFee = (payload) => {
  const baseFee = BASE_FEE_BY_SUBJECT[payload.subject] || DEFAULT_BASE_FEE;
  const durationFactor = payload.minutesPerSession / SESSION_LENGTH_BASE_MINUTES;
  const studentSurcharge = Math.max(0, payload.studentCount - 1) * STUDENT_COUNT_SURCHARGE;
  const feePerSession = Math.round(baseFee * durationFactor + studentSurcharge);
  const feePerMonth = feePerSession * payload.sessionsPerWeek * 4;
  return { feePerSession, feePerMonth };
};

const buildClassData = async (payload, userId) => {
  await ensureLocationValid(payload.provinceCode, payload.districtCode);
  const pricing = calculateFee(payload);
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
  return calculateFee(payload);
};

const createClass = async (payload, userId) => {
  const data = await buildClassData(payload, userId);
  return await classRepository.create(data);
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
    classes,
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
    throw new AppError(MESSAGE.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  return classItem;
};

const getSubjects = async () => {
  return SUBJECTS;
};

module.exports = {
  quoteClass,
  createClass,
  getClasses,
  getClassById,
  getSubjects,
};
