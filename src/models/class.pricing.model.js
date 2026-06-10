const mongoose = require("mongoose");

const baseFeeBySubjectSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    fee: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const classPricingConfigSchema = new mongoose.Schema(
  {
    configKey: { type: String, required: true, unique: true, default: "default" },
    defaultBaseFee: { type: Number, required: true, min: 0 },
    studentCountSurcharge: { type: Number, required: true, min: 0 },
    sessionLengthBaseMinutes: { type: Number, required: true, min: 1 },
    minutesPerSessionOptions: { type: [Number], required: true },
    sessionsPerWeekMin: { type: Number, required: true, min: 1 },
    sessionsPerWeekMax: { type: Number, required: true, min: 1 },
    baseFeeBySubject: { type: [baseFeeBySubjectSchema], required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ClassPricingConfig", classPricingConfigSchema);
