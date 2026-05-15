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

module.exports = {
  create,
  findById,
  findByClassCode,
  findMany,
};
