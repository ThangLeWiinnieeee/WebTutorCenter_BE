// Tạo object phân trang chuẩn dùng chung cho mọi service trả về danh sách.
// Đầu vào: page/limit hiện tại + tổng số bản ghi (totalItems).
const buildPagination = ({ page, limit, totalItems }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

module.exports = { buildPagination };
