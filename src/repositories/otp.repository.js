const Otp = require("../models/otp.model");

const create = async ({ email, otp, type, expiresAt }) => {
  return await Otp.create({ email, otp, type, expiresAt });
};

// Chỉ lấy OTP còn hạn và mới nhất (phòng trường hợp TTL chưa kịp dọn OTP cũ)
const findLatestActiveByEmailAndType = async (email, type) => {
  return await Otp.findOne({ email, type, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
};

const deleteByEmailAndType = async (email, type) => {
  return await Otp.deleteMany({ email, type });
};

// Xóa toàn bộ OTP theo email (xóa vĩnh viễn tài khoản)
const deleteByEmail = async (email) => {
  return await Otp.deleteMany({ email });
};

module.exports = {
  create,
  findLatestActiveByEmailAndType,
  deleteByEmailAndType,
  deleteByEmail,
};
