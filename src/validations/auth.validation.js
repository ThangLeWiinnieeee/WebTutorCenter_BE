const Joi = require("joi");
const ROLES = require("../constants/role");

const registerSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Họ tên không được để trống",
    "string.min": "Họ tên phải có ít nhất 2 ký tự",
    "string.max": "Họ tên không được vượt quá 100 ký tự",
    "any.required": "Họ tên là bắt buộc",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email không được để trống",
    "string.email": "Email không hợp lệ",
    "any.required": "Email là bắt buộc",
  }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "Mật khẩu không được để trống",
    "string.min": "Mật khẩu phải có ít nhất 6 ký tự",
    "any.required": "Mật khẩu là bắt buộc",
  }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "string.empty": "Mật khẩu xác nhận không được để trống",
    "any.only": "Mật khẩu xác nhận không khớp",
    "any.required": "Mật khẩu xác nhận là bắt buộc",
  }),
  role: Joi.string()
    .valid(ROLES.USER, ROLES.TUTOR)
    .default(ROLES.USER)
    .messages({
      "any.only": `Vai trò phải là '${ROLES.USER}' hoặc '${ROLES.TUTOR}'`,
    }),
  phone: Joi.string()
    .pattern(/^(0[3|5|7|8|9])+([0-9]{8})$/)
    .required()
    .messages({
      "string.pattern.base": "Số điện thoại không hợp lệ (phải là số điện thoại Việt Nam 10 số)",
      "any.required": "Số điện thoại là bắt buộc",
      "string.empty": "Số điện thoại không được để trống",
    }),
  dateOfBirth: Joi.date()
    .max("now")
    .required()
    .messages({
      "date.base": "Ngày sinh không hợp lệ",
      "date.max": "Ngày sinh không được lớn hơn thời gian hiện tại",
      "any.required": "Ngày sinh là bắt buộc",
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email không được để trống",
    "string.email": "Email không hợp lệ",
    "any.required": "Email là bắt buộc",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Mật khẩu không được để trống",
    "any.required": "Mật khẩu là bắt buộc",
  }),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email không hợp lệ",
    "any.required": "Email là bắt buộc",
  }),
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    "string.empty": "Mã OTP không được để trống",
    "string.length": "Mã OTP phải có đúng 6 chữ số",
    "string.pattern.base": "Mã OTP chỉ gồm các chữ số",
    "any.required": "Mã OTP là bắt buộc",
  }),
});

const resendOtpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email không được để trống",
    "string.email": "Email không hợp lệ",
    "any.required": "Email là bắt buộc",
  }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email không được để trống",
    "string.email": "Email không hợp lệ",
    "any.required": "Email là bắt buộc",
  }),
});

const verifyForgotPasswordOtpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email không được để trống",
    "string.email": "Email không hợp lệ",
    "any.required": "Email là bắt buộc",
  }),
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    "string.empty": "Mã OTP không được để trống",
    "string.length": "Mã OTP phải có đúng 6 chữ số",
    "string.pattern.base": "Mã OTP chỉ gồm các chữ số",
    "any.required": "Mã OTP là bắt buộc",
  }),
});

const resetPasswordSchema = Joi.object({
  resetToken: Joi.string().required().messages({
    "string.empty": "Reset token không được để trống",
    "any.required": "Reset token là bắt buộc",
  }),
  newPassword: Joi.string().min(6).required().messages({
    "string.empty": "Mật khẩu mới không được để trống",
    "string.min": "Mật khẩu mới phải có ít nhất 6 ký tự",
    "any.required": "Mật khẩu mới là bắt buộc",
  }),
  confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required().messages({
    "string.empty": "Mật khẩu xác nhận không được để trống",
    "any.only": "Mật khẩu xác nhận không khớp",
    "any.required": "Mật khẩu xác nhận là bắt buộc",
  }),
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => d.message);
    return res.status(422).json({ success: false, message: "Dữ liệu đầu vào không hợp lệ", errors });
  }
  req.body = value;
  next();
};

module.exports = {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  verifyForgotPasswordOtpSchema,
  resetPasswordSchema,
  validate,
};
