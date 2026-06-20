const ClassModel = require("../models/class.model");

const create = async (payload) => {
  const doc = new ClassModel(payload);
  return await doc.save();
};

const findById = async (id) => {
  return await ClassModel.findById(id).lean();
};

const findByClassCode = async (classCode) => {
  return await ClassModel.findOne({ classCode }).lean();
};

const findMany = async (filters = {}, options = {}) => {
  const page = options.page || 1;
  const limit = options.limit || 6;
  const skip = (page - 1) * limit;

  const [classes, totalItems] = await Promise.all([
    ClassModel.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ClassModel.countDocuments(filters),
  ]);

  return { classes, totalItems };
};

// Lấy các bài đăng tuyển gia sư thuộc một trong các môn (dành cho feed của gia sư)
const findBySubjects = async (subjects = [], options = {}) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;
  const filters = { subject: { $in: subjects } };
  if (options.excludeIds?.length) filters._id = { $nin: options.excludeIds };

  const [classes, totalItems] = await Promise.all([
    ClassModel.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ClassModel.countDocuments(filters),
  ]);

  return { classes, totalItems };
};

// Đếm số bài đăng mới (tạo từ thời điểm `since`) thuộc các môn đã cho
const countBySubjectsSince = async (subjects = [], since, excludeIds = []) => {
  const filter = { subject: { $in: subjects }, createdAt: { $gte: since } };
  if (excludeIds.length) filter._id = { $nin: excludeIds };
  return await ClassModel.countDocuments(filter);
};

// Danh sách bài đăng do một người dùng tạo (bài đăng tìm gia sư của họ)
const findByCreatedBy = async (userId, options = {}) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;
  const filters = { createdBy: userId };

  const [classes, totalItems] = await Promise.all([
    ClassModel.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ClassModel.countDocuments(filters),
  ]);

  return { classes, totalItems };
};

module.exports = {
  create,
  findById,
  findByClassCode,
  findMany,
  findBySubjects,
  countBySubjectsSince,
  findByCreatedBy,
};
