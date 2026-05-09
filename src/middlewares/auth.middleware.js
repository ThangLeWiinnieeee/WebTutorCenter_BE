const { verifyAccessToken } = require("../utils/token");
const { errorResponse } = require("../utils/response");
const MESSAGE = require("../constants/message");
const HTTP_STATUS = require("../constants/status");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        message: MESSAGE.TOKEN_MISSING,
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return errorResponse(res, {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: MESSAGE.TOKEN_INVALID,
    });
  }
};

module.exports = authMiddleware;
