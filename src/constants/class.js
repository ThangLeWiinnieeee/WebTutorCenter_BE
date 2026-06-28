// Vòng đời bài đăng tìm gia sư:
// - open: đang mở, hiển thị ở feed/danh sách để gia sư nhận.
// - matched: đã có gia sư được duyệt nhận lớp (ẩn khỏi feed, vẫn còn trong "bài đăng của tôi").
// - expired: đã đến thời gian bắt đầu mà chưa có gia sư nhận (ẩn khỏi feed, vẫn còn trong "bài đăng của tôi").
// - completed: lớp đã hoàn thành (hai phía xác nhận).
const CLASS_STATUS = {
  OPEN: "open",
  MATCHED: "matched",
  EXPIRED: "expired",
  COMPLETED: "completed",
};

module.exports = { CLASS_STATUS };
