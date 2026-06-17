const tutorRepository = require("../repositories/tutor.repository");
const userRepository = require("../repositories/user.repository");
const notificationService = require("./notification.service");
const { NOTIFICATION_TYPES } = require("../models/notification.model");
const AppError = require("../utils/AppError");
const MESSAGE = require("../constants/message");
const HTTP_STATUS = require("../constants/status");
const { TUTOR_STATUS } = require("../constants/tutor");
const { TutorMapper } = require("../mappers");

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

// Lấy danh sách tất cả gia sư đã approved (có phân trang, sắp xếp theo totalClassesAccepted)
const getActiveTutors = async (page = 1, limit = 20) => {
  const result = await tutorRepository.findAllApproved(page, limit);
  const dtoList = await TutorMapper.toDTOList(result.tutors);
  return {
    tutors: dtoList,
    total: result.total,
    page: result.page,
    limit: result.limit,
  };
};

// Lấy top 10 gia sư nổi bật (sắp xếp theo tổng số lần nhận lớp)
const getTopTutors = async (limit = 10) => {
  const tutors = await tutorRepository.findTopTutors(limit);
  return await TutorMapper.toDTOList(tutors);
};

// Lấy top 10 gia sư tháng hiện tại (sắp xếp theo classesAcceptedThisMonth)
const getTopTutorsThisMonth = async (limit = 10) => {
  const tutors = await tutorRepository.findTopTutorsThisMonth(limit);
  return await TutorMapper.toDTOList(tutors);
};

// Lấy gia sư mới được approved (trong N ngày gần đây)
const getNewTutors = async (days = 7, limit = 10) => {
  const tutors = await tutorRepository.findNewTutors(days, limit);
  return await TutorMapper.toDTOList(tutors);
};

// Tìm kiếm & lọc gia sư
const searchActiveTutors = async (filters = {}, page = 1, limit = 20) => {
  const result = await tutorRepository.searchTutors(filters, page, limit);
  const dtoList = await TutorMapper.toDTOList(result.tutors);
  return {
    tutors: dtoList,
    total: result.total,
    page: result.page,
    limit: result.limit,
  };
};

// Lấy chi tiết một gia sư (public endpoint)
const getTutorById = async (tutorId) => {
  const tutor = await tutorRepository.findById(tutorId);
  if (!tutor) {
    throw new AppError(MESSAGE.TUTOR_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  if (tutor.status !== TUTOR_STATUS.APPROVED) {
    throw new AppError(MESSAGE.TUTOR_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  return await TutorMapper.toDTO(tutor, null);
};

module.exports = {
  registerTutor,
  getTutorProfile,
  getActiveTutors,
  getTopTutors,
  getTopTutorsThisMonth,
  getNewTutors,
  searchActiveTutors,
  getTutorById,
};
