const locationService = require("../services/location.service");
const { successResponse } = require("../utils/response");
const AppError = require("../utils/AppError");

const handleError = (error, res, next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  next(error);
};

const getProvinces = async (req, res, next) => {
  try {
    const provinces = await locationService.getProvinces();
    return successResponse(res, {
      message: "Lấy danh sách tỉnh/thành phố thành công",
      data: { provinces },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const getDistricts = async (req, res, next) => {
  try {
    const provinceCode = Number(req.params.provinceCode);
    if (!provinceCode || isNaN(provinceCode)) {
      throw new AppError("Mã tỉnh/thành phố không hợp lệ", 400);
    }
    const districts = await locationService.getDistrictsByProvince(provinceCode);
    return successResponse(res, {
      message: "Lấy danh sách quận/huyện thành công",
      data: { districts },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

const getSchools = async (req, res, next) => {
  try {
    const { q } = req.query;
    const schools = await locationService.searchSchools(q || "");
    return successResponse(res, {
      message: "Lấy danh sách trường thành công",
      data: { schools },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

module.exports = {
  getProvinces,
  getDistricts,
  getSchools,
};
