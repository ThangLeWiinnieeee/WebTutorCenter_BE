const fs = require("fs");
const path = require("path");

const FALLBACK_SUBJECTS = [
  "Toán",
  "Ngữ văn",
  "Tiếng Anh",
  "Vật lý",
  "Hóa học",
  "Sinh học",
  "Lịch sử",
  "Địa lý",
  "Tin học",
];

const loadSubjects = () => {
  try {
    const subjectFilePath = path.resolve(__dirname, "../../../../subject.json");
    const raw = fs.readFileSync(subjectFilePath, "utf-8");
    const parsed = JSON.parse(raw);
    const subjects = Array.isArray(parsed.subject)
      ? parsed.subject.map((item) => item?.subject).filter(Boolean)
      : [];

    return subjects.length > 0 ? subjects : FALLBACK_SUBJECTS;
  } catch {
    return FALLBACK_SUBJECTS;
  }
};

const SUBJECTS = loadSubjects();

const GENDER_OPTIONS = ["male", "female", "other"];
const TUTOR_LEVEL_OPTIONS = ["student", "teacher", "any"];
const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PHONE_REGEX = /^(84|0)(3|5|7|8|9)[0-9]{8}$/;
const CLASS_STATUS = {
  OPEN: "open",
  CLOSED: "closed",
};

const MESSAGE = {
  QUOTE_SUCCESS: "Tính học phí lớp mới thành công",
  CREATE_SUCCESS: "Đăng lớp mới thành công",
  LIST_SUCCESS: "Lấy danh sách lớp mới thành công",
  DETAIL_SUCCESS: "Lấy chi tiết lớp mới thành công",
  SUBJECT_LIST_SUCCESS: "Lấy danh sách môn học thành công",
  NOT_FOUND: "Không tìm thấy lớp mới",
  INVALID_AREA: "Khu vực tỉnh/quận không hợp lệ",
};

module.exports = {
  SUBJECTS,
  GENDER_OPTIONS,
  TUTOR_LEVEL_OPTIONS,
  DAYS_OF_WEEK,
  PHONE_REGEX,
  CLASS_STATUS,
  MESSAGE,
};
