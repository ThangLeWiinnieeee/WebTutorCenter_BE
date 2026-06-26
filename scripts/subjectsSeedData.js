/**
 * Dữ liệu mồi (seed) cho danh mục môn học.
 *
 * ⚠️ ĐÂY KHÔNG PHẢI nguồn dùng lúc chạy. Nguồn môn học khi chạy là collection `Subject`
 * trong DB (admin quản lý) — validate/feed/endpoint đều đọc qua subjectService.getActiveSubjectNames().
 *
 * Mảng này chỉ dùng để nạp danh mục ban đầu vào DB khi cơ sở dữ liệu còn trống,
 * qua các script seed (seedSubjects.js, seedFullDemo.js, ...).
 */

const SUBJECTS = [
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

module.exports = SUBJECTS;
