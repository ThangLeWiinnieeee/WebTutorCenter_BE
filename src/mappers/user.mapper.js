class UserMapper {
  static toDTO(user) {
    if (!user) {
      throw new Error("UserMapper.toDTO: user is required");
    }

    return {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      type: user.type,
      phone: user.phone,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      avatar: user.avatar,
      isActive: user.isActive,
      isVerified: user.isVerified,
      phoneActivated: user.phoneActivated,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

module.exports = UserMapper;
