const lookupService = require("../services/lookup.service");
const { successResponse } = require("../utils/response");
const AppError = require("../utils/AppError");
const HTTP_STATUS = require("../constants/status");

const handleError = (error, res, next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  next(error);
};

const lookupController = {
  // Lấy lookup values theo type (public)
  async getByType(req, res, next) {
    try {
      const { type } = req.params;
      const values = await lookupService.getByType(type);
      return successResponse(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Lấy danh sách thành công",
        data: { values },
      });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  // Lấy districts của province (public)
  async getDistrictsByProvince(req, res, next) {
    try {
      const { province } = req.params;
      const districts = await lookupService.getDistrictsByProvince(province);
      return successResponse(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Lấy danh sách quận/huyện thành công",
        data: { districts },
      });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  // Lấy tất cả lookup data (grouped)
  async getAllGrouped(req, res, next) {
    try {
      const data = await lookupService.getAllGrouped();
      return successResponse(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Lấy danh sách lookup thành công",
        data,
      });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  // Admin: Create lookup
  async createLookup(req, res, next) {
    try {
      const lookup = await lookupService.createLookup(req.body);
      return successResponse(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: "Tạo lookup thành công",
        data: { lookup },
      });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  // Admin: Create many lookups
  async createManyLookups(req, res, next) {
    try {
      const { lookups } = req.body;
      const created = await lookupService.createManyLookups(lookups);
      return successResponse(res, {
        statusCode: HTTP_STATUS.CREATED,
        message: `Tạo ${created.length} lookup thành công`,
        data: { count: created.length },
      });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  // Admin: Update lookup
  async updateLookup(req, res, next) {
    try {
      const { id } = req.params;
      const lookup = await lookupService.updateLookup(id, req.body);
      return successResponse(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Cập nhật lookup thành công",
        data: { lookup },
      });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  // Admin: Delete lookup
  async deleteLookup(req, res, next) {
    try {
      const { id } = req.params;
      await lookupService.deleteLookup(id);
      return successResponse(res, {
        statusCode: HTTP_STATUS.OK,
        message: "Xóa lookup thành công",
      });
    } catch (error) {
      handleError(error, res, next);
    }
  },

  // Admin: Delete all by type
  async deleteByType(req, res, next) {
    try {
      const { type } = req.params;
      await lookupService.deleteByType(type);
      return successResponse(res, {
        statusCode: HTTP_STATUS.OK,
        message: `Xóa tất cả lookup type ${type} thành công`,
      });
    } catch (error) {
      handleError(error, res, next);
    }
  },
};

module.exports = lookupController;
