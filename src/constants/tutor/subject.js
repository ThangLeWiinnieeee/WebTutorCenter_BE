const fs = require("fs");
const path = require("path");

const HARDCODED_SUBJECTS = [
  "Toán",
  "Ngữ văn",
  "Tiếng Anh",
  "Vật lý",
  "Hóa học",
  "Sinh học",
  "Lịch sử",
  "Địa lý",
  "Giáo dục công dân",
  "Tin học",
  "Tiếng Pháp",
  "Tiếng Trung",
  "Tiếng Nhật",
  "Tiếng Hàn",
  "Tiếng Đức",
  "Âm nhạc",
  "Mỹ thuật",
  "Thể dục",
  "Toán cao cấp",
  "Vật lý đại cương",
  "Hóa học đại cương",
  "Lập trình",
  "Kinh tế",
];

const loadSubjects = () => {
  try {
    const subjectFilePath = path.resolve(__dirname, "../../../../subject.json");
    const raw = fs.readFileSync(subjectFilePath, "utf-8");
    const parsed = JSON.parse(raw);
    const subjectsFromFile = Array.isArray(parsed.subject)
      ? parsed.subject.map((item) => item?.subject).filter(Boolean)
      : [];

    const combined = Array.from(new Set([...HARDCODED_SUBJECTS, ...subjectsFromFile]));
    return combined.filter((s) => s !== "Kế toán");
  } catch {
    return HARDCODED_SUBJECTS;
  }
};

const SUBJECTS = loadSubjects();

module.exports = SUBJECTS;
