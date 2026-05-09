const { Province, District, School } = require("../models/location.model");

const findAllProvinces = async () => {
  return await Province.find({}).sort({ name: 1 }).lean();
};

const findDistrictsByProvinceCode = async (provinceCode) => {
  return await District.find({ provinceCode }).sort({ name: 1 }).lean();
};

const findProvinceByCode = async (code) => {
  return await Province.findOne({ code }).lean();
};

const findDistrictByCode = async (code) => {
  return await District.findOne({ code }).lean();
};

const bulkUpsertProvinces = async (provinces) => {
  const ops = provinces.map((p) => ({
    updateOne: {
      filter: { code: p.code },
      update: { $set: p },
      upsert: true,
    },
  }));
  return await Province.bulkWrite(ops);
};

const bulkUpsertDistricts = async (districts) => {
  const ops = districts.map((d) => ({
    updateOne: {
      filter: { code: d.code },
      update: { $set: d },
      upsert: true,
    },
  }));
  return await District.bulkWrite(ops);
};

const removeVietnameseTones = (str) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const searchSchools = async (query, limit = 20) => {
  if (!query || !query.trim()) {
    return await School.find({}).sort({ name: 1 }).limit(limit).lean();
  }

  const trimmed = query.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const queryNoTone = removeVietnameseTones(trimmed);
  const wordsNoTone = queryNoTone.split(/\s+/).filter(Boolean);

  const nameConditions = words.map((w) => ({
    name: { $regex: escapeRegex(w), $options: "i" },
  }));

  const nameSearchConditions = wordsNoTone.map((w) => ({
    nameSearch: { $regex: escapeRegex(w), $options: "i" },
  }));

  const filter = {
    $or: [{ $and: nameConditions }, { $and: nameSearchConditions }],
  };

  return await School.find(filter).sort({ name: 1 }).limit(limit).lean();
};

const bulkUpsertSchools = async (schools) => {
  const ops = schools.map((s) => ({
    updateOne: {
      filter: { name: s.name },
      update: { $set: { ...s, nameSearch: removeVietnameseTones(s.name) } },
      upsert: true,
    },
  }));
  return await School.bulkWrite(ops);
};

module.exports = {
  findAllProvinces,
  findDistrictsByProvinceCode,
  findProvinceByCode,
  findDistrictByCode,
  bulkUpsertProvinces,
  bulkUpsertDistricts,
  searchSchools,
  bulkUpsertSchools,
};
