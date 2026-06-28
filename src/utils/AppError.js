class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isUserError = true;
  }
}

module.exports = AppError;
