const HTTP_STATUS = require("../constants/status");
const MESSAGE = require("../constants/message");

// Middleware validate dùng chung cho mọi module (thay cho các bản `validate`
// lặp lại trong từng file *.validation.js). Dùng hằng số HTTP_STATUS/MESSAGE
// thay vì viết cứng mã 422 và chuỗi thông báo.
const buildValidator = (source, message) => (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req[source], { abortEarly: false, convert: true });
  if (error) {
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
      success: false,
      message,
      errors: error.details.map((d) => d.message),
    });
  }
  req[source] = value;
  next();
};

// Validate body request
const validate = buildValidator("body", MESSAGE.VALIDATION_ERROR);
// Alias rõ nghĩa hơn cho body (một số module dùng tên này)
const validateBody = validate;
// Validate query string (bộ lọc/phân trang)
const validateQuery = buildValidator("query", MESSAGE.QUERY_VALIDATION_ERROR);

module.exports = { validate, validateBody, validateQuery };
