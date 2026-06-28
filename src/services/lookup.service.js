const lookupRepository = require("../repositories/lookup.repository");

const lookupService = {
  // Lấy danh sách values theo type (public)
  async getByType(type) {
    const values = await lookupRepository.getValuesByType(type, true);
    if (values.length === 0) {
      // Thiếu dữ liệu lookup là lỗi cấu hình/seed phía hệ thống (không phải người dùng thao tác sai)
      // → ném lỗi thường để error middleware ghi log ở terminal BE và KHÔNG hiển thị ra FE.
      throw new Error(`Không tìm thấy dữ liệu lookup cho: ${type}`);
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
      // Thiếu dữ liệu quận/huyện là lỗi cấu hình/seed phía hệ thống → log ở terminal BE, không đẩy ra FE.
      throw new Error(`Không tìm thấy quận/huyện cho: ${provinceValue}`);
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
