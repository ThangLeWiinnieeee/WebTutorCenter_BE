const HTTP_STATUS = require("../constants/status");
const MESSAGE = require("../constants/message");

const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || MESSAGE.INTERNAL_SERVER_ERROR;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;
