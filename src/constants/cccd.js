const CCCD_DECISION = Object.freeze({
  PASS: "pass",
  RETAKE: "retake",
  REVIEW: "review",
  SUSPICIOUS: "suspicious",
});

const CCCD_SUBMITTABLE_DECISIONS = Object.freeze([
  CCCD_DECISION.PASS,
  CCCD_DECISION.REVIEW,
  CCCD_DECISION.SUSPICIOUS,
]);

module.exports = { CCCD_DECISION, CCCD_SUBMITTABLE_DECISIONS };
