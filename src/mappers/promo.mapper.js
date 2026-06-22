class PromoMapper {
  static toDTO(promo) {
    if (!promo) return null;

    return {
      id: promo._id,
      code: promo.code,
      description: promo.description || "",
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      maxDiscountAmount: promo.maxDiscountAmount ?? null,
      isActive: promo.isActive,
      startsAt: promo.startsAt || null,
      expiresAt: promo.expiresAt || null,
      usageLimit: promo.usageLimit ?? null,
      usedCount: promo.usedCount || 0,
      deletedAt: promo.deletedAt || null,
      createdAt: promo.createdAt,
      updatedAt: promo.updatedAt,
    };
  }

  static toDTOs(promos) {
    if (!Array.isArray(promos)) return [];
    return promos.map((item) => this.toDTO(item));
  }
}

module.exports = PromoMapper;
