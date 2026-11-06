const LearnerAffinity = require("../models/learnerAffinity.model");
const { nextAffinityEntry, decayAffinityMap } = require("./tutor.repository");
const { LEARNER_AFFINITY } = require("../constants/tutor");

// Điểm đã suy giảm về hiện tại của học viên: { "môn|tỉnh": điểm } (đã bỏ khóa dưới ngưỡng)
const findDecayedContexts = async (userId, now = Date.now()) => {
  const doc = await LearnerAffinity.findOne({ userId }, { contexts: 1 }).lean();
  return decayAffinityMap(doc?.contexts, now);
};

// Cộng `weight` vào khóa `key`, giữ tối đa MAX_CONTEXTS khóa điểm cao nhất.
// - throttleMs: khóa vừa được cộng trong khoảng này thì bỏ qua (chống spam bộ lọc).
// - classId: lớp đã từng được cộng thì bỏ qua (mỗi lớp 1 lần).
// Trả true nếu đã cộng.
// shortcut: đọc-rồi-ghi, hai sự kiện đồng thời có thể mất 1 lượt cộng; chuyển sang pipeline update nếu cần chính xác.
const bump = async (userId, key, weight, { throttleMs = 0, classId = null } = {}, now = Date.now()) => {
  const doc = await LearnerAffinity.findOne({ userId }).lean();
  if (classId && (doc?.countedClassIds || []).some((id) => String(id) === String(classId))) return false;
  const prev = doc?.contexts?.[key];
  if (throttleMs && prev && now - prev.t < throttleMs) return false;

  const contexts = { ...(doc?.contexts || {}), [key]: nextAffinityEntry(prev, weight, now) };
  const kept = Object.entries(decayAffinityMap(contexts, now))
    .sort((a, b) => b[1] - a[1])
    .slice(0, LEARNER_AFFINITY.MAX_CONTEXTS)
    .map(([k]) => [k, contexts[k]]);

  // Điều kiện $ne trên classId giữ "mỗi lớp 1 lần" kể cả khi 2 request chạy song song:
  // request thua không khớp → upsert đụng unique userId → 11000 → coi như đã cộng.
  const filter = classId ? { userId, countedClassIds: { $ne: classId } } : { userId };
  const update = { $set: { contexts: Object.fromEntries(kept) } };
  if (classId) update.$addToSet = { countedClassIds: classId };
  try {
    await LearnerAffinity.updateOne(filter, update, { upsert: true });
    return true;
  } catch (error) {
    if (error?.code === 11000) return false;
    throw error;
  }
};

// Xóa dữ liệu cá nhân hóa của một người dùng (xóa vĩnh viễn tài khoản)
const deleteByUserId = async (userId) => LearnerAffinity.deleteOne({ userId });

module.exports = {
  findDecayedContexts,
  bump,
  deleteByUserId,
};
