const Lookup = require("../models/lookup.model");

const lookupRepository = {
  // Lấy tất cả lookup values theo type
  async getByType(type, activeOnly = true) {
    const query = { type };
    if (activeOnly) {
      query.isActive = true;
    }
    return await Lookup.find(query).sort({ order: 1 });
  },

  // Lấy tất cả lookup values theo type, chỉ lấy value và label
  async getValuesByType(type, activeOnly = true) {
    const query = { type };
    if (activeOnly) {
      query.isActive = true;
    }
    return await Lookup.find(query, { value: 1, label: 1, parentId: 1 }).sort({ order: 1 });
  },

  // Lấy districts của một province (parentId)
  async getDistrictsByProvince(provinceId, activeOnly = true) {
    const query = {
      type: "district",
      parentId: provinceId,
    };
    if (activeOnly) {
      query.isActive = true;
    }
    return await Lookup.find(query).sort({ order: 1 });
  },

  // Lấy tất cả lookup theo type và parentId
  async getByTypeAndParent(type, parentId, activeOnly = true) {
    const query = { type, parentId };
    if (activeOnly) {
      query.isActive = true;
    }
    return await Lookup.find(query).sort({ order: 1 });
  },

  // Create lookup
  async create(data) {
    return await Lookup.create(data);
  },

  // Create many
  async createMany(data) {
    return await Lookup.insertMany(data);
  },

  // Update lookup
  async updateById(id, data) {
    return await Lookup.findByIdAndUpdate(id, data, { new: true });
  },

  // Delete lookup
  async deleteById(id) {
    return await Lookup.findByIdAndDelete(id);
  },

  // Delete all by type
  async deleteByType(type) {
    return await Lookup.deleteMany({ type });
  },

  // Count by type
  async countByType(type) {
    return await Lookup.countDocuments({ type });
  },

  // Get all lookup data (grouped by type)
  async getAllGrouped() {
    const lookups = await Lookup.find({ isActive: true }).sort({ type: 1, order: 1 });
    
    const grouped = {};
    lookups.forEach((lookup) => {
      if (!grouped[lookup.type]) {
        grouped[lookup.type] = [];
      }
      grouped[lookup.type].push({
        value: lookup.value,
        label: lookup.label,
        parentId: lookup.parentId,
      });
    });

    return grouped;
  },
};

module.exports = lookupRepository;
