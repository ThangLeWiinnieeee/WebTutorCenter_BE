const Joi = require("joi");

const adminListClassesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  keyword: Joi.string().trim().allow("").max(100).optional(),
  subject: Joi.string().trim().allow("").max(100).optional(),
});

module.exports = {
  adminListClassesQuerySchema,
};
