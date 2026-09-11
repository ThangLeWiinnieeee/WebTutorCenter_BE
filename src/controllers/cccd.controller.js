const cccdService = require("../services/cccd.service");
const HTTP_STATUS = require("../constants/status");
const MESSAGE = require("../constants/message");
const { successResponse } = require("../utils/response");

const verify = async (req, res, next) => {
  try {
    const data = await cccdService.verifyAndUpload(
      req.user.id,
      req.files.front[0],
      req.files.back[0]
    );
    return successResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: MESSAGE.CCCD_VERIFY_SUCCESS,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { verify };
