const Tutor = require("../models/tutor.model");
const { TUTOR_STATUS } = require("../constants/tutor");

const POPULATE_USER = "fullName email gender dateOfBirth avatar phone";

const findByUserId = async (userId) => {
  return await Tutor.findOne({ userId });
};

const findById = async (id) => {
  return await Tutor.findById(id).populate("userId", POPULATE_USER);
};

const create = async (tutorData) => {
  const tutor = new Tutor(tutorData);
  return await tutor.save();
};

const update = async (tutorId, updateData) => {
  return await Tutor.findByIdAndUpdate(tutorId, updateData, { new: true, runValidators: true })
    .populate("userId", POPULATE_USER);
};

const updateByUserId = async (userId, updateData) => {
  return await Tutor.findOneAndUpdate({ userId }, updateData, { new: true, runValidators: true });
};

const findAllPending = async () => {
  return await Tutor.find({ status: TUTOR_STATUS.PENDING })
    .populate("userId", POPULATE_USER)
    .sort({ createdAt: -1 });
};

const countByStatus = async (status) => {
  return await Tutor.countDocuments({ status });
};

const findAll = async () => {
  return await Tutor.find({})
    .populate("userId", POPULATE_USER)
    .sort({ createdAt: -1 });
};

module.exports = {
  findByUserId,
  findById,
  create,
  update,
  updateByUserId,
  findAllPending,
  countByStatus,
  findAll,
};
