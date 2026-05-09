const Joi = require("joi");

const updateProfileSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Họ tên không được để trống",
    "string.min": "Họ tên phải có ít nhất 2 ký tự",
    "string.max": "Họ tên không được vượt quá 100 ký tự",
    "any.required": "Họ tên là bắt buộc",
  }),
  phone: Joi.string()
    .pattern(/^(0[3|5|7|8|9])+([0-9]{8})$/)
    .required()
    .messages({
      "string.pattern.base": "Số điện thoại không hợp lệ (phải là số điện thoại Việt Nam 10 số)",
      "any.required": "Số điện thoại là bắt buộc",
      "string.empty": "Số điện thoại là bắt buộc",
    }),
  gender: Joi.string()
    .valid("male", "female", "other")
    .allow(null, "")
    .optional()
    .messages({
      "any.only": "Giới tính không hợp lệ",
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
  updateProfileSchema,
  validate,
};
