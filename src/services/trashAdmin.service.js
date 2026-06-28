const userRepository = require("../repositories/user.repository");
const classRepository = require("../repositories/class.repository");
const promoRepository = require("../repositories/promo.repository");
const classApplicationRepository = require("../repositories/class.application.repository");
const reviewRepository = require("../repositories/review.repository");
const reviewService = require("./review.service");
const AppError = require("../utils/AppError");
const HTTP_STATUS = require("../constants/status");
const { UserMapper, ClassMapper, PromoMapper, ReviewMapper } = require("../mappers");
const { buildPagination } = require("../utils/pagination");

// Đăng ký xử lý cho từng loại dữ liệu có thể nằm trong thùng rác
const TRASH_ENTITIES = {
  users: {
    label: "Người dùng",
    list: async ({ page, limit }) => {
      const { users, totalItems } = await userRepository.findDeleted({ page, limit });
      return { items: UserMapper.toDTOs(users), totalItems };
    },
    restore: (id) => userRepository.restore(id),
    purge: (id) => userRepository.hardDelete(id),
  },
  classes: {
    label: "Bài đăng",
    list: async ({ page, limit }) => {
      const { classes, totalItems } = await classRepository.findDeleted({ page, limit });
      return { items: ClassMapper.toDTOs(classes), totalItems };
    },
    restore: (id) => classRepository.restore(id),
    // Xóa vĩnh viễn bài đăng kèm các đơn nhận lớp liên quan
    purge: async (id) => {
      const purged = await classRepository.deleteById(id);
      if (purged) await classApplicationRepository.deleteByClassId(id);
      return purged;
    },
  },
  promos: {
    label: "Mã ưu đãi",
    list: async ({ page, limit }) => {
      const { items, totalItems } = await promoRepository.findDeleted({ page, limit });
      return { items: PromoMapper.toDTOs(items), totalItems };
    },
    restore: (id) => promoRepository.restore(id),
    purge: (id) => promoRepository.deleteById(id),
  },
  reviews: {
    label: "Đánh giá",
    list: async ({ page, limit }) => {
      const { items, totalItems } = await reviewRepository.findDeleted({ page, limit });
      return { items: ReviewMapper.toTrashDTOs(items), totalItems };
    },
    // Khôi phục đánh giá → tính lại điểm trung bình của gia sư
    restore: async (id) => {
      const restored = await reviewRepository.restore(id);
      if (restored) await reviewService.recomputeTutorRating(restored.tutorId);
      return restored;
    },
    purge: (id) => reviewRepository.deleteById(id),
  },
};

const getTrashEntity = (type) => {
  const entity = TRASH_ENTITIES[type];
  if (!entity) throw new AppError("Loại dữ liệu không hợp lệ", HTTP_STATUS.BAD_REQUEST);
  return entity;
};

const getTrashItems = async (type, query = {}) => {
  const entity = getTrashEntity(type);
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const { items, totalItems } = await entity.list({ page, limit });
  return {
    type,
    items,
    pagination: buildPagination({ page, limit, totalItems }),
  };
};

const restoreTrashItem = async (type, id) => {
  const entity = getTrashEntity(type);
  const restored = await entity.restore(id);
  if (!restored) throw new AppError("Không tìm thấy mục cần khôi phục", HTTP_STATUS.NOT_FOUND);
  return { id };
};

const purgeTrashItem = async (type, id) => {
  const entity = getTrashEntity(type);
  const purged = await entity.purge(id);
  if (!purged) throw new AppError("Không tìm thấy mục cần xóa", HTTP_STATUS.NOT_FOUND);
  return { id };
};

const getTrashCounts = async () => {
  const [users, classes, promos, reviews] = await Promise.all([
    userRepository.findDeleted({ page: 1, limit: 1 }),
    classRepository.findDeleted({ page: 1, limit: 1 }),
    promoRepository.findDeleted({ page: 1, limit: 1 }),
    reviewRepository.findDeleted({ page: 1, limit: 1 }),
  ]);
  return {
    users: users.totalItems,
    classes: classes.totalItems,
    promos: promos.totalItems,
    reviews: reviews.totalItems,
  };
};

module.exports = {
  getTrashItems,
  restoreTrashItem,
  purgeTrashItem,
  getTrashCounts,
};
