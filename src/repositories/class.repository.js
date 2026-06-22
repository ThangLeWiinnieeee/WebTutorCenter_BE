const ClassModel = require("../models/class.model");

// Mặc định mọi truy vấn đọc đều bỏ qua bài đăng đã xóa mềm (nằm trong thùng rác)
const NOT_DELETED = { deletedAt: null };

const create = async (payload) => {
  const doc = new ClassModel(payload);
  return await doc.save();
};

const findById = async (id) => {
  return await ClassModel.findOne({ _id: id, ...NOT_DELETED }).lean();
};

// Kiểm tra trùng mã lớp — phải xét cả bài đăng đã xóa mềm để tránh tái dùng mã
const findByClassCode = async (classCode) => {
  return await ClassModel.findOne({ classCode }).lean();
};

const findMany = async (filters = {}, options = {}) => {
  const page = options.page || 1;
  const limit = options.limit || 6;
  const skip = (page - 1) * limit;
  const queryFilters = { ...NOT_DELETED, ...filters };

  const [classes, totalItems] = await Promise.all([
    ClassModel.find(queryFilters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ClassModel.countDocuments(queryFilters),
  ]);

  return { classes, totalItems };
};

// Lấy các bài đăng tuyển gia sư thuộc một trong các môn (dành cho feed của gia sư)
const findBySubjects = async (subjects = [], options = {}) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;
  const filters = { ...NOT_DELETED, subject: { $in: subjects } };
  if (options.excludeIds?.length) filters._id = { $nin: options.excludeIds };

  const [classes, totalItems] = await Promise.all([
    ClassModel.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ClassModel.countDocuments(filters),
  ]);

  return { classes, totalItems };
};

// Đếm số bài đăng mới (tạo từ thời điểm `since`) thuộc các môn đã cho
const countBySubjectsSince = async (subjects = [], since, excludeIds = []) => {
  const filter = { ...NOT_DELETED, subject: { $in: subjects }, createdAt: { $gte: since } };
  if (excludeIds.length) filter._id = { $nin: excludeIds };
  return await ClassModel.countDocuments(filter);
};

// Danh sách bài đăng cho admin (có lọc + populate người đăng)
const findManyForAdmin = async (filters = {}, options = {}) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;
  const queryFilters = { ...NOT_DELETED, ...filters };

  const [classes, totalItems] = await Promise.all([
    ClassModel.find(queryFilters)
      .populate("createdBy", "fullName email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ClassModel.countDocuments(queryFilters),
  ]);

  return { classes, totalItems };
};

const findByIdPopulated = async (id) => {
  return await ClassModel.findOne({ _id: id, ...NOT_DELETED })
    .populate("createdBy", "fullName email avatar")
    .lean();
};

// Xóa mềm: đưa bài đăng vào thùng rác
const softDelete = async (id, adminUserId) => {
  return await ClassModel.findOneAndUpdate(
    { _id: id, ...NOT_DELETED },
    { deletedAt: new Date(), deletedBy: adminUserId },
    { new: true },
  ).lean();
};

// Khôi phục bài đăng khỏi thùng rác
const restore = async (id) => {
  return await ClassModel.findOneAndUpdate(
    { _id: id, deletedAt: { $ne: null } },
    { deletedAt: null, deletedBy: null },
    { new: true },
  ).lean();
};

// Danh sách bài đăng trong thùng rác (đã xóa mềm)
const findDeleted = async (options = {}) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;
  const filters = { deletedAt: { $ne: null } };

  const [classes, totalItems] = await Promise.all([
    ClassModel.find(filters)
      .populate("createdBy", "fullName email avatar")
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ClassModel.countDocuments(filters),
  ]);

  return { classes, totalItems };
};

// Xóa vĩnh viễn (hard delete) — chỉ áp dụng cho bài đăng đang ở thùng rác
const deleteById = async (id) => {
  return await ClassModel.findOneAndDelete({ _id: id, deletedAt: { $ne: null } }).lean();
};

// Danh sách bài đăng do một người dùng tạo (bài đăng tìm gia sư của họ)
const findByCreatedBy = async (userId, options = {}) => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;
  const filters = { ...NOT_DELETED, createdBy: userId };

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
  findManyForAdmin,
  findByIdPopulated,
  softDelete,
  restore,
  findDeleted,
  deleteById,
};
