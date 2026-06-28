const AppError = require("../utils/AppError");
const HTTP_STATUS = require("../constants/status");
const promoRepository = require("../repositories/promo.repository");
const { PromoMapper } = require("../mappers");
const { buildPagination } = require("../utils/pagination");
const { generateUniqueCode } = require("../utils/code");

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

  // Chỉ liệt kê mã toàn cục (ownerUserId null/thiếu) — ẩn voucher cá nhân khỏi trang admin
  const filter = { ownerUserId: null };
  if (query.keyword) filter.code = { $regex: normalizeCode(query.keyword), $options: "i" };
  if (query.discountType) filter.discountType = query.discountType;
  if (query.isActive !== undefined) filter.isActive = query.isActive;

  const { items, totalItems } = await promoRepository.findMany(filter, { page, limit });

  return {
    promos: PromoMapper.toDTOs(items),
    pagination: buildPagination({ page, limit, totalItems }),
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
// `userId` (nếu có) dùng để kiểm tra quyền sở hữu voucher cá nhân.
// Trả về document promo (mongoose) để service khác có thể tăng usedCount.
const evaluatePromo = async (code, amount, userId = null) => {
  const normalized = normalizeCode(code);
  if (!normalized) throw new AppError("Vui lòng nhập mã ưu đãi", HTTP_STATUS.BAD_REQUEST);

  const promo = await promoRepository.findByCode(normalized);
  if (!promo || promo.deletedAt) throw new AppError("Mã ưu đãi không tồn tại", HTTP_STATUS.UNPROCESSABLE_ENTITY);
  if (!promo.isActive) throw new AppError("Mã ưu đãi đã ngừng áp dụng", HTTP_STATUS.UNPROCESSABLE_ENTITY);

  // Voucher cá nhân chỉ chủ sở hữu mới dùng được; mã toàn cục (ownerUserId null) ai cũng dùng
  if (promo.ownerUserId && String(promo.ownerUserId) !== String(userId)) {
    throw new AppError("Mã này không thuộc về bạn", HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }

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
const validatePromoForAmount = async (code, amount, userId = null) => {
  const { promo, discountAmount, finalAmount } = await evaluatePromo(code, amount, userId);
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

// ──────────────────────────── Voucher cá nhân (kho mã) ────────────────────────────

// Cấu hình mã quà tặng khi hoàn thành lớp
const REWARD_VOUCHER = {
  discountType: "percent",
  discountValue: 10,
  maxDiscountAmount: 200000,
  usageLimit: 1,
  validityMonths: 2,
};

const generateUniqueVoucherCode = () =>
  generateUniqueCode({
    generate: () => `RW${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    exists: (code) => promoRepository.findByCode(code),
    errorMessage: "Không tạo được mã giảm giá, vui lòng thử lại",
  });

// Tạo voucher cá nhân tặng cho 1 user (khi hoàn thành lớp). Trả document promo đã tạo.
const generateRewardVoucher = async (ownerUserId, { classCode } = {}) => {
  const code = await generateUniqueVoucherCode();
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + REWARD_VOUCHER.validityMonths);

  return await promoRepository.create({
    code,
    ownerUserId,
    description: classCode ? `Quà hoàn thành lớp ${classCode}` : "Quà hoàn thành lớp học",
    discountType: REWARD_VOUCHER.discountType,
    discountValue: REWARD_VOUCHER.discountValue,
    maxDiscountAmount: REWARD_VOUCHER.maxDiscountAmount,
    usageLimit: REWARD_VOUCHER.usageLimit,
    expiresAt,
    isActive: true,
  });
};

// Trạng thái hiển thị của một voucher trong kho mã
const voucherStatus = (promo) => {
  if (promo.usageLimit != null && (promo.usedCount || 0) >= promo.usageLimit) return "used";
  if (!promo.isActive) return "expired";
  if (promo.expiresAt && Date.now() > new Date(promo.expiresAt).getTime()) return "expired";
  return "active";
};

const listMyVouchers = async (userId, query = {}) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const { items, totalItems } = await promoRepository.findByOwner(userId, { page, limit });

  return {
    vouchers: items.map((p) => ({ ...PromoMapper.toDTO(p), status: voucherStatus(p) })),
    pagination: buildPagination({ page, limit, totalItems }),
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
  generateRewardVoucher,
  listMyVouchers,
};
