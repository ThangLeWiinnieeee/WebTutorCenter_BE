const learnerAffinityRepository = require("../repositories/learnerAffinity.repository");
const subjectService = require("./subject.service");
const ROLES = require("../constants/role");
const { LEARNER_AFFINITY } = require("../constants/tutor");

// Khóa "môn|tỉnh" (một vế có thể rỗng). null nếu cả hai rỗng hoặc tên môn không dùng được làm key Map.
const contextKey = (subject, province) => {
  const s = subject ? String(subject).trim() : "";
  const p = Number(province) > 0 ? String(Number(province)) : "";
  if (!s && !p) return null;
  if (s.includes(".") || s.startsWith("$")) return null;
  return `${s}|${p}`;
};

// Tách khóa ngược lại; tỉnh luôn là số nên cắt ở dấu "|" cuối cùng
const parseContextKey = (key) => {
  const i = key.lastIndexOf("|");
  const province = key.slice(i + 1);
  return { subject: key.slice(0, i) || null, province: province ? Number(province) : null };
};

// Học viên áp dụng bộ lọc ở /tutors → +FILTER cho khóa "môn|tỉnh" (cùng khóa chờ 60s).
// Môn phải thuộc danh mục đang bật (không tin client); môn lạ thì chỉ tính theo tỉnh.
const recordFilter = async (user, { subject, province } = {}) => {
  if (user?.role !== ROLES.USER) return false;
  const target = typeof subject === "string" ? subject.trim().toLowerCase() : "";
  const names = target ? await subjectService.getActiveSubjectNames() : [];
  const canonical = names.find((n) => n.toLowerCase() === target) || "";
  const key = contextKey(canonical, province);
  if (!key) return false;
  return learnerAffinityRepository.bump(user.id, key, LEARNER_AFFINITY.WEIGHT.FILTER, {
    throttleMs: LEARNER_AFFINITY.FILTER_THROTTLE_MS,
  });
};

// Đăng/mời/chọn gia sư thành công → +CLASS cho "môn|tỉnh" của lớp, mỗi lớp 1 lần.
const recordClass = async (userId, classItem) => {
  const key = contextKey(classItem?.subject, classItem?.provinceCode);
  if (!userId || !key) return false;
  return learnerAffinityRepository.bump(userId, key, LEARNER_AFFINITY.WEIGHT.CLASS, {
    classId: classItem._id,
  });
};

// Ngữ cảnh xếp hạng cho searchTutors: [{ subject, province, score }].
// Khách, không phải học viên hoặc lỗi đọc → [] (về thứ tự chung).
const getRankingContexts = async (user) => {
  if (user?.role !== ROLES.USER) return [];
  try {
    const scores = await learnerAffinityRepository.findDecayedContexts(user.id);
    return Object.entries(scores).map(([key, score]) => ({ ...parseContextKey(key), score }));
  } catch {
    return [];
  }
};

module.exports = {
  contextKey,
  parseContextKey,
  recordFilter,
  recordClass,
  getRankingContexts,
};
