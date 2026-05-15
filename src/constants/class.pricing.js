const BASE_FEE_BY_SUBJECT = {
  "Toán": 150000,
  "Ngữ văn": 140000,
  "Tiếng Anh": 170000,
  "Vật lý": 160000,
  "Hóa học": 160000,
  "Sinh học": 150000,
  "Lịch sử": 130000,
  "Địa lý": 130000,
  "Giáo dục công dân": 130000,
  "Tin học": 180000,
  "Tiếng Pháp": 180000,
  "Tiếng Trung": 180000,
  "Tiếng Nhật": 180000,
  "Tiếng Hàn": 180000,
  "Tiếng Đức": 180000,
  "Âm nhạc": 160000,
  "Mỹ thuật": 160000,
  "Thể dục": 120000,
  "Toán cao cấp": 200000,
  "Vật lý đại cương": 190000,
  "Hóa học đại cương": 190000,
  "Lập trình": 200000,
  "Kinh tế": 170000,
};

const DEFAULT_BASE_FEE = 150000;
const STUDENT_COUNT_SURCHARGE = 15000;
const SESSION_LENGTH_BASE_MINUTES = 90;
const MIN_SESSIONS_PER_WEEK = 1;
const MAX_SESSIONS_PER_WEEK = 7;

module.exports = {
  BASE_FEE_BY_SUBJECT,
  DEFAULT_BASE_FEE,
  STUDENT_COUNT_SURCHARGE,
  SESSION_LENGTH_BASE_MINUTES,
  MIN_SESSIONS_PER_WEEK,
  MAX_SESSIONS_PER_WEEK,
};
