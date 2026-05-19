const ClassPricingConfig = require("../models/class.pricing.model");

const DEFAULT_CONFIG_KEY = "default";

const findDefault = async () => {
  return await ClassPricingConfig.findOne({ configKey: DEFAULT_CONFIG_KEY }).lean();
};

const upsertDefault = async (payload) => {
  return await ClassPricingConfig.findOneAndUpdate(
    { configKey: DEFAULT_CONFIG_KEY },
    { ...payload, configKey: DEFAULT_CONFIG_KEY },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
};

module.exports = {
  findDefault,
  upsertDefault,
};
