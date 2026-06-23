const Subject = require("../models/subject.model");

// Escape ký tự đặc biệt để dùng trong RegExp khi khớp tên (không phân biệt hoa/thường).
const escapeRegex = (str) => String(str).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findAll = async ({ activeOnly = false, keyword = "" } = {}) => {
  const filter = {};
  if (activeOnly) filter.isActive = true;
  if (keyword) filter.name = { $regex: escapeRegex(keyword), $options: "i" };
  return await Subject.find(filter).sort({ order: 1, name: 1 });
};

const findById = async (id) => {
  return await Subject.findById(id);
};

// Khớp tên chính xác nhưng không phân biệt hoa/thường (để chặn trùng).
const findByName = async (name) => {
  return await Subject.findOne({ name: { $regex: `^${escapeRegex(name)}$`, $options: "i" } });
};

const existsByName = async (name, exceptId = null) => {
  const filter = { name: { $regex: `^${escapeRegex(name)}$`, $options: "i" } };
  if (exceptId) filter._id = { $ne: exceptId };
  return await Subject.exists(filter);
};

const create = async (data) => {
  return await Subject.create(data);
};

const updateById = async (id, data) => {
  return await Subject.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const maxOrder = async () => {
  const top = await Subject.findOne().sort({ order: -1 }).select("order");
  return top?.order ?? 0;
};

module.exports = {
  findAll,
  findById,
  findByName,
  existsByName,
  create,
  updateById,
  maxOrder,
};
