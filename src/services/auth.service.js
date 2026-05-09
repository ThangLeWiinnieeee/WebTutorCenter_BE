const { OAuth2Client } = require("google-auth-library");
const userRepository = require("../repositories/user.repository");
const otpRepository = require("../repositories/otp.repository");
const { hashPassword, comparePassword } = require("../utils/hash");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, generateResetToken, verifyResetToken } = require("../utils/token");
const { generateOtp, getOtpExpiry, isResendTooSoon, getResendWaitSeconds, OTP_EXPIRES_MINUTES } = require("../utils/otp");
const { sendOtpEmail, sendForgotPasswordOtpEmail } = require("../utils/email");
const MESSAGE = require("../constants/message");
const HTTP_STATUS = require("../constants/status");
const ACCOUNT_TYPE = require("../constants/accountType");
const OTP_TYPE = require("../constants/otpType");
const AppError = require("../utils/AppError");
const UserMapper = require("../mappers/user.mapper");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const _issueTokens = async (user) => {
  const payload = { id: user._id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  await userRepository.updateRefreshToken(user._id, refreshToken);
  return { accessToken, refreshToken };
};

const _createAndSendOtp = async ({ email, fullName, type }) => {
  const existingOtp = await otpRepository.findLatestActiveByEmailAndType(email, type);

  if (existingOtp && isResendTooSoon(existingOtp.createdAt)) {
    const waitSeconds = getResendWaitSeconds(existingOtp.createdAt);
    throw new AppError(`${MESSAGE.OTP_RESEND_TOO_SOON} (còn ${waitSeconds}s)`, 429);
  }

  const otp = generateOtp();
  const expiresAt = getOtpExpiry();

  await otpRepository.create({ email, otp, type, expiresAt });

  if (type === OTP_TYPE.FORGOT_PASSWORD) {
    await sendForgotPasswordOtpEmail({ to: email, fullName, otp, expiresInMinutes: OTP_EXPIRES_MINUTES });
  } else {
    await sendOtpEmail({ to: email, fullName, otp, expiresInMinutes: OTP_EXPIRES_MINUTES });
  }
};

// ─── REGISTER ───

const register = async ({ fullName, email, password, role, phone, dateOfBirth }) => {
  const existingUser = await userRepository.findByEmail(email);

  if (existingUser) {
    if (existingUser.type === ACCOUNT_TYPE.GOOGLE) {
      throw new AppError(MESSAGE.EXISTING_ACCOUNT_GOOGLE, HTTP_STATUS.BAD_REQUEST);
    }
    if (existingUser.isVerified) {
      throw new AppError(MESSAGE.EMAIL_ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
    }
    // Email đã đăng ký nhưng chưa xác thực → gửi lại OTP (cooldown được kiểm tra trong _createAndSendOtp)
    await _createAndSendOtp({ email, fullName: existingUser.fullName, type: OTP_TYPE.REGISTER });
    return { email };
  }

  const hashedPassword = await hashPassword(password);
  const user = await userRepository.create({
    fullName,
    email,
    password: hashedPassword,
    role,
    phone,
    dateOfBirth,
    type: ACCOUNT_TYPE.LOCAL,
    isVerified: false,
    phoneActivated: true,
  });

  await _createAndSendOtp({ email, fullName, type: OTP_TYPE.REGISTER });

  return { email: user.email };
};

// ─── VERIFY OTP ───

const verifyOtp = async ({ email, otp, type = OTP_TYPE.REGISTER }) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new AppError(MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  if (type === OTP_TYPE.REGISTER && user.isVerified) {
    throw new AppError(MESSAGE.OTP_ALREADY_VERIFIED, HTTP_STATUS.CONFLICT);
  }

  // findLatestActiveByEmailAndType đã lọc expiresAt > now nên không cần kiểm tra thêm
  const otpDoc = await otpRepository.findLatestActiveByEmailAndType(email, type);
  if (!otpDoc) {
    throw new AppError(MESSAGE.OTP_EXPIRED, HTTP_STATUS.BAD_REQUEST);
  }

  if (otpDoc.otp !== otp) {
    throw new AppError(MESSAGE.OTP_INVALID, HTTP_STATUS.BAD_REQUEST);
  }

  // OTP hợp lệ → xóa khỏi collection
  await otpRepository.deleteByEmailAndType(email, type);

  if (type === OTP_TYPE.REGISTER) {
    const verifiedUser = await userRepository.verifyUser(user._id);
    const { accessToken, refreshToken } = await _issueTokens(verifiedUser);
    return { accessToken, refreshToken, user: UserMapper.toDTO(verifiedUser) };
  }

  // Với forgot_password: chỉ trả về xác nhận, việc đổi mật khẩu xử lý ở bước tiếp theo
  return { email };
};

// ─── RESEND OTP ───

const resendOtp = async ({ email, type = OTP_TYPE.REGISTER }) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new AppError(MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  if (type === OTP_TYPE.REGISTER && user.isVerified) {
    throw new AppError(MESSAGE.OTP_ALREADY_VERIFIED, HTTP_STATUS.CONFLICT);
  }

  await _createAndSendOtp({ email, fullName: user.fullName, type });

  return { email };
};

// ─── FORGOT PASSWORD ───

const forgotPassword = async ({ email }) => {
  const user = await userRepository.findByEmail(email);

  // Không tiết lộ email có tồn tại hay không (bảo mật)
  if (!user || !user.isVerified) return { email };

  // Chỉ cho phép đặt lại mật khẩu cho tài khoản sử dụng mật khẩu (local)
  if (user.type === ACCOUNT_TYPE.GOOGLE) {
    throw new AppError(MESSAGE.ACCOUNT_NOT_CHANGE_PASSWORD, HTTP_STATUS.BAD_REQUEST);
  }

  await _createAndSendOtp({ email, fullName: user.fullName, type: OTP_TYPE.FORGOT_PASSWORD });

  return { email };
};

// ─── VERIFY FORGOT PASSWORD OTP ───

const verifyForgotPasswordOtp = async ({ email, otp }) => {
  const user = await userRepository.findByEmail(email);
  if (!user || !user.isVerified) {
    throw new AppError(MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  const otpDoc = await otpRepository.findLatestActiveByEmailAndType(email, OTP_TYPE.FORGOT_PASSWORD);
  if (!otpDoc) {
    throw new AppError(MESSAGE.OTP_EXPIRED, HTTP_STATUS.BAD_REQUEST);
  }

  if (otpDoc.otp !== otp) {
    throw new AppError(MESSAGE.OTP_INVALID, HTTP_STATUS.BAD_REQUEST);
  }

  // OTP hợp lệ → xóa và cấp resetToken
  await otpRepository.deleteByEmailAndType(email, OTP_TYPE.FORGOT_PASSWORD);

  const resetToken = generateResetToken({ id: user._id, email: user.email });

  return { resetToken };
};

// ─── RESET PASSWORD ───

const resetPassword = async ({ resetToken, newPassword }) => {
  let decoded;
  try {
    decoded = verifyResetToken(resetToken);
  } catch {
    throw new AppError(MESSAGE.RESET_TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  const user = await userRepository.findById(decoded.id);
  if (!user) {
    throw new AppError(MESSAGE.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  const hashedPassword = await hashPassword(newPassword);
  await userRepository.updatePassword(user._id, hashedPassword);
};

// ─── LOGIN ───

const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email, true);
  if (!user) {
    throw new AppError(MESSAGE.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  if (!user.isVerified) {
    throw new AppError(MESSAGE.EMAIL_NOT_VERIFIED, HTTP_STATUS.FORBIDDEN);
  }

  if (!user.isActive) {
    throw new AppError("Tài khoản của bạn đã bị vô hiệu hóa", HTTP_STATUS.FORBIDDEN);
  }

  // Tài khoản Google: không có hash mật khẩu — tránh gọi bcrypt (sẽ lỗi Illegal arguments: string, object)
  if (user.type === ACCOUNT_TYPE.GOOGLE) {
    throw new AppError(MESSAGE.EXISTING_ACCOUNT_GOOGLE, HTTP_STATUS.BAD_REQUEST);
  }

  if (typeof user.password !== "string" || !user.password) {
    throw new AppError(MESSAGE.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new AppError(MESSAGE.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  const { accessToken, refreshToken } = await _issueTokens(user);
  return { accessToken, refreshToken, user: UserMapper.toDTO(user) };
};

// ─── LOGOUT ───

const logout = async (userId) => {
  await userRepository.updateRefreshToken(userId, null);
};

// ─── REFRESH TOKEN ───

const refreshToken = async (token) => {
  if (!token) {
    throw new AppError(MESSAGE.REFRESH_TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  try {
    verifyRefreshToken(token);
  } catch {
    throw new AppError(MESSAGE.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  const user = await userRepository.findByRefreshToken(token);
  if (!user) {
    throw new AppError(MESSAGE.REFRESH_TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  const { accessToken, refreshToken: newRefreshToken } = await _issueTokens(user);
  return { accessToken, refreshToken: newRefreshToken };
};

// ─── GOOGLE LOGIN ───

const googleLogin = async ({ credential }) => {
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw new AppError(MESSAGE.GOOGLE_TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  const { email, name, picture } = payload;

  const existingUser = await userRepository.findByEmail(email);

  if (existingUser) {
    if (existingUser.type === ACCOUNT_TYPE.LOCAL) {
      throw new AppError(MESSAGE.EXISTING_ACCOUNT_LOCAL, HTTP_STATUS.BAD_REQUEST);
    }

    if (!existingUser.isActive) {
      throw new AppError("Tài khoản của bạn đã bị vô hiệu hóa", HTTP_STATUS.FORBIDDEN);
    }

    const { accessToken, refreshToken } = await _issueTokens(existingUser);
    return { accessToken, refreshToken, user: UserMapper.toDTO(existingUser) };
  }

  const newUser = await userRepository.create({
    fullName: name,
    email,
    avatar: picture,
    type: ACCOUNT_TYPE.GOOGLE,
    isVerified: true,
  });

  const { accessToken, refreshToken } = await _issueTokens(newUser);
  return { accessToken, refreshToken, user: UserMapper.toDTO(newUser) };
};

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
  login,
  googleLogin,
  logout,
  refreshToken,
};
