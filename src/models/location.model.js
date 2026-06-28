const mongoose = require("mongoose");

const provinceSchema = new mongoose.Schema(
  {
    code: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    codename: {
      type: String,
      trim: true,
    },
    divisionType: {
      type: String,
      trim: true,
    },
    phoneCode: {
      type: Number,
      default: null,
    },
  },
  { timestamps: false }
);

provinceSchema.index({ name: 1 });

const districtSchema = new mongoose.Schema(
  {
    code: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    codename: {
      type: String,
      trim: true,
    },
    divisionType: {
      type: String,
      trim: true,
    },
    provinceCode: {
      type: Number,
      required: true,
    },
  },
  { timestamps: false }
);

districtSchema.index({ provinceCode: 1, name: 1 });

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nameSearch: {
      type: String,
      trim: true,
    },
    shortName: {
      type: String,
      trim: true,
      default: null,
    },
    type: {
      type: String,
      enum: ["university", "college", "academy"],
      required: true,
    },
    provinceCode: {
      type: Number,
      default: null,
    },
  },
  { timestamps: false }
);

schoolSchema.index({ name: "text", shortName: "text" });
schoolSchema.index({ type: 1, name: 1 });
schoolSchema.index({ nameSearch: 1 });

const Province = mongoose.model("Province", provinceSchema);
const District = mongoose.model("District", districtSchema);
const School = mongoose.model("School", schoolSchema);

module.exports = { Province, District, School };
