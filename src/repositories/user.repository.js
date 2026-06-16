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
};
