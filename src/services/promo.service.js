const AppError = require("../utils/AppError");
const HTTP_STATUS = require("../constants/status");
const promoRepository = require("../repositories/promo.repository");
const { PromoMapper } = require("../mappers");

const normalizeCode = (code) => String(code || "").toUpperCase().trim();

// Kiểm tra ràng buộc logic giữa các field trước khi lưu
const assertValidShape = (data) => {
  if (data.discountType === "percent" && Number(data.discountValue) > 100) {
    throw new AppError("Giảm theo % không được vượt quá 100", HTTP_STATUS.BAD_REQUEST);
  }
  if (
    data.startsAt &&
    data.expiresAt &&
    new Date(data.startsAt).getTime() > new Date(data.expiresAt).getTime()
  ) {
    throw new AppError("Ngày bắt đầu phải trước ngày hết hạn", HTTP_STATUS.BAD_REQUEST);
  }
  // Trần giảm tối đa chỉ có ý nghĩa với mã %
  if (data.discountType === "fixed" && data.maxDiscountAmount != null) {
    data.maxDiscountAmount = null;
  }
};

// ──────────────────────────── Admin CRUD ────────────────────────────

const createPromo = async (payload) => {
  const data = { ...payload, code: normalizeCode(payload.code) };
  assertValidShape(data);

  const existing = await promoRepository.findByCode(data.code);
  if (existing) {
    if (existing.deletedAt) {
      throw new AppError(
        "Mã này đang nằm trong thùng rác. Hãy khôi phục hoặc xóa vĩnh viễn trước khi tạo lại.",
        HTTP_STATUS.CONFLICT,
      );
    }
    throw new AppError("Mã ưu đãi đã tồn tại", HTTP_STATUS.CONFLICT);
  }

  const created = await promoRepository.create(data);
  return PromoMapper.toDTO(created);
};

const listPromos = async (query = {}) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const filter = {};
  if (query.keyword) filter.code = { $regex: normalizeCode(query.keyword), $options: "i" };
  if (query.discountType) filter.discountType = query.discountType;
  if (query.isActive !== undefined) filter.isActive = query.isActive;

  const { items, totalItems } = await promoRepository.findMany(filter, { page, limit });
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  return {
    promos: PromoMapper.toDTOs(items),
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const updatePromo = async (id, payload) => {
  const promo = await promoRepository.findById(id);
  if (!promo) throw new AppError("Không tìm thấy mã ưu đãi", HTTP_STATUS.NOT_FOUND);

  const data = { ...payload };
  if (payload.code !== undefined) {
    const code = normalizeCode(payload.code);
    const dup = await promoRepository.findByCode(code);
    if (dup && dup._id.toString() !== String(id)) {
      throw new AppError("Mã ưu đãi đã tồn tại", HTTP_STATUS.CONFLICT);
    }
    data.code = code;
  }

  assertValidShape({ ...promo.toObject(), ...data });

  const updated = await promoRepository.updateById(id, data);
  return PromoMapper.toDTO(updated);
};

// Xóa mềm: đưa mã vào thùng rác (admin có thể khôi phục hoặc xóa vĩnh viễn sau)
const deletePromo = async (id, adminUserId) => {
  const deleted = await promoRepository.softDelete(id, adminUserId);
  if (!deleted) throw new AppError("Không tìm thấy mã ưu đãi", HTTP_STATUS.NOT_FOUND);
  return PromoMapper.toDTO(deleted);
};

// ──────────────────────────── Logic áp dụng ────────────────────────────

// Tính số tiền được giảm dựa trên loại mã + giá trị đơn (amount)
const computeDiscount = (promo, amount) => {
  let discount = 0;
  if (promo.discountType === "percent") {
    discount = (amount * promo.discountValue) / 100;
    if (promo.maxDiscountAmount != null) {
      discount = Math.min(discount, promo.maxDiscountAmount);
    }
  } else {
    discount = promo.discountValue;
  }
  discount = Math.min(discount, amount); // không vượt quá giá trị đơn
  return Math.max(0, Math.round(discount));
};

// Kiểm tra hợp lệ + tính giảm; throw AppError (422) nếu không dùng được.
// Trả về document promo (mongoose) để service khác có thể tăng usedCount.
const evaluatePromo = async (code, amount) => {
  const normalized = normalizeCode(code);
  if (!normalized) throw new AppError("Vui lòng nhập mã ưu đãi", HTTP_STATUS.BAD_REQUEST);

  const promo = await promoRepository.findByCode(normalized);
  if (!promo || promo.deletedAt) throw new AppError("Mã ưu đãi không tồn tại", HTTP_STATUS.UNPROCESSABLE_ENTITY);
  if (!promo.isActive) throw new AppError("Mã ưu đãi đã ngừng áp dụng", HTTP_STATUS.UNPROCESSABLE_ENTITY);

  const now = Date.now();
  if (promo.startsAt && now < new Date(promo.startsAt).getTime()) {
    throw new AppError("Mã ưu đãi chưa có hiệu lực", HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }
  if (promo.expiresAt && now > new Date(promo.expiresAt).getTime()) {
    throw new AppError("Mã ưu đãi đã hết hạn", HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }
  if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) {
    throw new AppError("Mã ưu đãi đã hết lượt sử dụng", HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

  const discountAmount = computeDiscount(promo, amount);
  return { promo, discountAmount, finalAmount: Math.max(0, amount - discountAmount) };
};

// Endpoint preview cho người dùng nhập mã ở màn báo giá (không tăng usedCount)
const validatePromoForAmount = async (code, amount) => {
  const { promo, discountAmount, finalAmount } = await evaluatePromo(code, amount);
  return {
    code: promo.code,
    description: promo.description || "",
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    maxDiscountAmount: promo.maxDiscountAmount ?? null,
    amount,
    discountAmount,
    finalAmount,
  };
};

module.exports = {
  createPromo,
  listPromos,
  updatePromo,
  deletePromo,
  computeDiscount,
  evaluatePromo,
  validatePromoForAmount,
};
