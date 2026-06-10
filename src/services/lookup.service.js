const lookupRepository = require("../repositories/lookup.repository");
const AppError = require("../utils/AppError");
const HTTP_STATUS = require("../constants/status");

const lookupService = {
  // Lấy danh sách values theo type (public)
  async getByType(type) {
    const values = await lookupRepository.getValuesByType(type, true);
    if (values.length === 0) {
      throw new AppError(`Không tìm thấy dữ liệu lookup cho: ${type}`, HTTP_STATUS.NOT_FOUND);
    }
    return values.map((v) => ({
      value: v.value,
      label: v.label,
      parentId: v.parentId || undefined,
    }));
  },

  // Lấy districts của province (public)
  async getDistrictsByProvince(provinceValue) {
    const districts = await lookupRepository.getDistrictsByProvince(provinceValue, true);
    if (districts.length === 0) {
      throw new AppError(`Không tìm thấy quận/huyện cho: ${provinceValue}`, HTTP_STATUS.NOT_FOUND);
    }
    return districts.map((d) => ({
      value: d.value,
      label: d.label,
    }));
  },

  // Lấy tất cả lookup data (grouped)
  async getAllGrouped() {
    return await lookupRepository.getAllGrouped();
  },

  // Admin: Create lookup
  async createLookup(data) {
    return await lookupRepository.create(data);
  },

  // Admin: Create many lookups
  async createManyLookups(data) {
    return await lookupRepository.createMany(data);
  },

  // Admin: Update lookup
  async updateLookup(id, data) {
    return await lookupRepository.updateById(id, data);
  },

  // Admin: Delete lookup
  async deleteLookup(id) {
    return await lookupRepository.deleteById(id);
  },

  // Admin: Delete all by type
  async deleteByType(type) {
    return await lookupRepository.deleteByType(type);
  },
};

module.exports = lookupService;
