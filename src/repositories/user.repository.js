const User = require("../models/user.model");

const findByEmail = async (email, includePassword = false) => {
  const query = User.findOne({ email });
  if (includePassword) query.select("+password");
  return await query;
};

const findById = async (id, includePassword = false) => {
  const query = User.findOne({ _id: id, deletedAt: null });
  if (includePassword) query.select("+password");
  return await query;
};

const findManyForAdmin = async (filters, { page, limit }) => {
  const skip = (page - 1) * limit;
  const queryFilters = { deletedAt: null, ...filters };
  const [users, totalItems] = await Promise.all([
    User.find(queryFilters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(queryFilters),
  ]);

  return { users, totalItems };
};

const create = async (userData) => {
  const user = new User(userData);
  return await user.save();
};

const updateRefreshToken = async (userId, refreshToken) => {
  return await User.findByIdAndUpdate(userId, { refreshToken }, { new: true });
};

const findByRefreshToken = async (refreshToken) => {
  return await User.findOne({ refreshToken }).select("+refreshToken");
};

const verifyUser = async (userId) => {
  return await User.findByIdAndUpdate(userId, { isVerified: true }, { new: true });
};

const updatePassword = async (userId, hashedPassword) => {
  return await User.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true });
};

const updateProfile = async (userId, updateData) => {
  return await User.findOneAndUpdate(
    { _id: userId, deletedAt: null },
    updateData,
    { new: true, runValidators: true },
  );
};

const updateRole = async (userId, role) => {
  return await User.findOneAndUpdate({ _id: userId, deletedAt: null }, { role }, { new: true });
};

const updateStatus = async (userId, isActive) => {
  return await User.findOneAndUpdate({ _id: userId, deletedAt: null }, { isActive }, { new: true });
};

const updateByAdmin = async (userId, updateData) => {
  return await User.findOneAndUpdate(
    { _id: userId, deletedAt: null },
    updateData,
    { new: true, runValidators: true },
  );
};

const softDeleteByAdmin = async (userId, adminUserId) => {
  return await User.findOneAndUpdate(
    { _id: userId, deletedAt: null },
    {
      isActive: false,
      refreshToken: null,
      deletedAt: new Date(),
      deletedBy: adminUserId,
    },
    { new: true },
  );
};

const findAllByRole = async (role) => {
  return await User.find({ role, deletedAt: null, isActive: true }).lean();
};

// ──────────────────────────── Thùng rác (soft-delete) ────────────────────────────

const findDeleted = async ({ page, limit }) => {
  const skip = (page - 1) * limit;
  const filter = { deletedAt: { $ne: null } };
  const [users, totalItems] = await Promise.all([
    User.find(filter).sort({ deletedAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  return { users, totalItems };
};

// Khôi phục tài khoản khỏi thùng rác (kích hoạt lại để dùng được ngay)
const restore = async (userId) => {
  return await User.findOneAndUpdate(
    { _id: userId, deletedAt: { $ne: null } },
    { deletedAt: null, deletedBy: null, isActive: true },
    { new: true },
  );
};

// Xóa vĩnh viễn (hard delete) — chỉ áp dụng cho tài khoản đang ở thùng rác
const hardDelete = async (userId) => {
  return await User.findOneAndDelete({ _id: userId, deletedAt: { $ne: null } });
};

module.exports = {
  findByEmail,
  findById,
  findManyForAdmin,
  create,
  updateRefreshToken,
  findByRefreshToken,
  verifyUser,
  updatePassword,
  updateProfile,
  updateRole,
  updateStatus,
  updateByAdmin,
  softDeleteByAdmin,
  findAllByRole,
  findDeleted,
  restore,
  hardDelete,
};
