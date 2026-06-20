const Joi = require("joi");
const {
  SUBJECTS,
  OCCUPATION_STATUS,
  PHONE_REGEX,
  TIME_REGEX,
  DAYS_OF_WEEK,
} = require("../constants/tutor");

const availabilitySlotSchema = Joi.object({
  day: Joi.string()
    .valid(...DAYS_OF_WEEK)
    .required()
    .messages({
      "any.only": "Ngày không hợp lệ, phải là Mon–Sun",
      "any.required": "Ngày trong tuần là bắt buộc",
      "string.empty": "Ngày trong tuần không được để trống",
    }),
  hour: Joi.number().integer().min(0).max(23).required().messages({
    "number.min": "Khung giờ phải từ 0 đến 23",
    "number.max": "Khung giờ phải từ 0 đến 23",
    "any.required": "Khung giờ là bắt buộc",
  }),
});

const registerTutorSchema = Joi.object({
  phone: Joi.string()
    .pattern(PHONE_REGEX)
    .required()
    .messages({
      "string.pattern.base": "Số điện thoại không hợp lệ (VD: 0912345678 hoặc 84912345678)",
      "any.required": "Số điện thoại liên hệ là bắt buộc",
      "string.empty": "Số điện thoại liên hệ không được để trống",
    }),

  subjects: Joi.array()
    .items(
      Joi.string()
        .trim()
        .valid(...SUBJECTS)
        .messages({ "any.only": "Môn học '{#value}' không hợp lệ" })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "Phải chọn ít nhất 1 môn học",
      "any.required": "Môn học là bắt buộc",
      "array.base": "Môn học phải là một mảng",
    }),

  occupationStatus: Joi.string()
    .valid(...Object.values(OCCUPATION_STATUS))
    .required()
    .messages({
      "any.only": "Tình trạng nghề nghiệp không hợp lệ (chỉ chấp nhận: student, graduated, teacher)",
      "any.required": "Tình trạng nghề nghiệp là bắt buộc",
      "string.empty": "Tình trạng nghề nghiệp không được để trống",
    }),

  teachingAreas: Joi.object({
    province: Joi.number().integer().required().messages({
      "number.base": "Mã tỉnh/thành phải là số",
      "any.required": "Mã tỉnh/thành là bắt buộc",
    }),
    districts: Joi.array()
      .items(Joi.number().integer().messages({ "number.base": "Mã quận/huyện phải là số" }))
      .min(1)
      .required()
      .messages({
        "array.min": "Phải chọn ít nhất 1 quận/huyện",
        "any.required": "Danh sách quận/huyện là bắt buộc",
        "array.base": "Danh sách quận/huyện phải là một mảng",
      }),
  })
    .required()
    .messages({
      "any.required": "Khu vực dạy là bắt buộc",
      "object.base": "Khu vực dạy không hợp lệ",
    }),

  currentArea: Joi.object({
    province: Joi.number().integer().required().messages({
      "number.base": "Mã tỉnh/thành phải là số",
      "any.required": "Mã tỉnh/thành là bắt buộc",
    }),
    district: Joi.number().integer().required().messages({
      "number.base": "Mã quận/huyện phải là số",
      "any.required": "Mã quận/huyện là bắt buộc",
    }),
  })
    .required()
    .messages({
      "any.required": "Khu vực hiện tại là bắt buộc",
      "object.base": "Khu vực hiện tại không hợp lệ",
    }),

  schoolName: Joi.string().min(2).max(200).required().messages({
    "string.empty": "Tên trường không được để trống",
    "string.min": "Tên trường phải có ít nhất 2 ký tự",
    "string.max": "Tên trường không được vượt quá 200 ký tự",
    "any.required": "Tên trường là bắt buộc",
  }),

  graduationYear: Joi.number()
    .integer()
    .min(1950)
    .max(new Date().getFullYear())
    // "" → undefined (Joi sẽ bỏ qua), tránh để Mongoose Number cast "" thành NaN/0
    .empty("")
    .allow(null)
    .optional()
    .messages({
      "number.base": "Năm tốt nghiệp phải là số",
      "number.integer": "Năm tốt nghiệp phải là số nguyên",
      "number.min": "Năm tốt nghiệp phải từ 1950 trở lên",
      "number.max": `Năm tốt nghiệp không được lớn hơn ${new Date().getFullYear()}`,
    }),

  bio: Joi.string().min(10).max(2000).required().messages({
    "string.empty": "Phần giới thiệu bản thân không được để trống",
    "string.min": "Phần giới thiệu bản thân phải có ít nhất 10 ký tự",
    "string.max": "Phần giới thiệu bản thân không được vượt quá 2000 ký tự",
    "any.required": "Phần giới thiệu bản thân là bắt buộc",
  }),

  availability: Joi.array()
    .items(availabilitySlotSchema)
    .min(1)
    .required()
    .custom((slots, helpers) => {
      if (!Array.isArray(slots) || slots.length < 2) return slots;
      const seen = new Set();
      for (const slot of slots) {
        if (!slot || !slot.day || slot.hour === undefined) continue;
        const key = `${slot.day}-${slot.hour}`;
        if (seen.has(key)) {
          return helpers.message({
            custom: `Trùng lịch giảng dạy: ngày ${slot.day} lúc ${slot.hour}h đã được chọn nhiều lần`,
          });
        }
        seen.add(key);
      }
      return slots;
    })
    .messages({
      "array.base": "Lịch giảng dạy phải là một mảng",
      "array.min": "Phải có ít nhất 1 khung giờ giảng dạy",
      "any.required": "Lịch giảng dạy là bắt buộc",
    }),
});

const rejectTutorSchema = Joi.object({
  rejectionReason: Joi.string().trim().min(5).max(500).required().messages({
    "string.empty": "Lý do từ chối không được để trống",
    "string.min": "Lý do từ chối phải có ít nhất 5 ký tự",
    "string.max": "Lý do từ chối không được vượt quá 500 ký tự",
    "any.required": "Lý do từ chối là bắt buộc",
  }),
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, convert: true });
  if (error) {
    const errors = error.details.map((d) => d.message);
    return res.status(422).json({ success: false, message: "Dữ liệu đầu vào không hợp lệ", errors });
  }
  req.body = value;
  next();
};

module.exports = {
  registerTutorSchema,
  rejectTutorSchema,
  validate,
};
