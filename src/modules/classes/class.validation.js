const Joi = require("joi");
const { SUBJECTS, GENDER_OPTIONS, TUTOR_LEVEL_OPTIONS, DAYS_OF_WEEK, PHONE_REGEX } = require("./constants");

const availabilitySlotSchema = Joi.object({
  day: Joi.string()
    .valid(...DAYS_OF_WEEK)
    .required(),
  hour: Joi.number().integer().min(0).max(23).required(),
});

const baseClassSchema = Joi.object({
  contactPhone: Joi.string().pattern(PHONE_REGEX).required(),
  summary: Joi.string().trim().min(10).max(200).required(),
  description: Joi.string().trim().min(20).max(2000).required(),
  subject: Joi.string()
    .valid(...SUBJECTS)
    .required(),
  studentGender: Joi.string()
    .valid(...GENDER_OPTIONS)
    .required(),
  studentCount: Joi.number().integer().min(1).max(20).required(),
  startDate: Joi.date().iso().required(),
  minutesPerSession: Joi.number().integer().min(60).max(180).required(),
  sessionsPerWeek: Joi.number().integer().min(1).max(7).required(),
  provinceCode: Joi.number().integer().required(),
  districtCode: Joi.number().integer().required(),
  locationLabel: Joi.string().trim().max(200).required(),
  availabilitySlots: Joi.array()
    .items(availabilitySlotSchema)
    .min(1)
    .required()
    .custom((slots, helpers) => {
      const seen = new Set();
      for (const slot of slots) {
        const key = `${slot.day}-${slot.hour}`;
        if (seen.has(key)) {
          return helpers.message({ custom: "Khung giờ bị trùng lặp" });
        }
        seen.add(key);
      }
      return slots;
    }),
  tutorGenderPref: Joi.string()
    .valid(...GENDER_OPTIONS, "any")
    .default("any"),
  tutorLevelPref: Joi.string()
    .valid(...TUTOR_LEVEL_OPTIONS)
    .default("any"),
  promoCode: Joi.string().trim().max(50).allow("", null).optional(),
});

const quoteClassSchema = baseClassSchema;
const createClassSchema = baseClassSchema;

const listClassQuerySchema = Joi.object({
  subject: Joi.string().trim().max(100).optional(),
  provinceCode: Joi.number().integer().optional(),
  districtCode: Joi.number().integer().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(6),
});

const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, convert: true });
  if (error) {
    return res.status(422).json({
      success: false,
      message: "Dữ liệu đầu vào không hợp lệ",
      errors: error.details.map((item) => item.message),
    });
  }
  req.body = value;
  next();
};

const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, { abortEarly: false, convert: true });
  if (error) {
    return res.status(422).json({
      success: false,
      message: "Bộ lọc không hợp lệ",
      errors: error.details.map((item) => item.message),
    });
  }
  req.query = value;
  next();
};

module.exports = {
  quoteClassSchema,
  createClassSchema,
  listClassQuerySchema,
  validateBody,
  validateQuery,
};
