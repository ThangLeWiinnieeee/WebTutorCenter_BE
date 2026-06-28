const locationRepository = require("../repositories/location.repository");

class TutorMapper {
  // options.includeDocuments: chỉ thêm ảnh giấy tờ (CCCD/bằng cấp) cho người được phép xem
  // (chủ hồ sơ + admin). Mặc định KHÔNG trả để không lộ ở endpoint công khai.
  static async toDTO(tutor, user, cache = null, options = {}) {
    if (!tutor) {
      throw new Error("TutorMapper.toDTO: tutor is required");
    }

    const [teachingAreas, currentArea] = await Promise.all([
      TutorMapper._resolveTeachingAreas(tutor.teachingAreas, cache),
      TutorMapper._resolveCurrentArea(tutor.currentArea, cache),
    ]);

    const documents = options.includeDocuments
      ? {
          cccdFrontImage: tutor.cccdFrontImage || null,
          cccdBackImage: tutor.cccdBackImage || null,
          studentCardFrontImage: tutor.studentCardFrontImage || null,
          studentCardBackImage: tutor.studentCardBackImage || null,
          certificateImages: tutor.certificateImages || [],
        }
      : {};

    // userId có thể là ObjectId (chưa populate) hoặc populated document.
    // Khi populated, tutor.userId._id trả ObjectId; khi chưa, fallback về tutor.userId.
    // Các field user (fullName, email...) ưu tiên từ param user, fallback sang populated userId.
    return {
      id: tutor._id,
      userId: tutor.userId._id || tutor.userId,
      fullName: user?.fullName || tutor.userId?.fullName || null,
      email: user?.email || tutor.userId?.email || null,
      gender: user?.gender || tutor.userId?.gender || null,
      dateOfBirth: user?.dateOfBirth || tutor.userId?.dateOfBirth || null,
      avatar: user?.avatar || tutor.userId?.avatar || null,
      phone: tutor.phone,
      subjects: tutor.subjects,
      occupationStatus: tutor.occupationStatus,
      teachingAreas,
      currentArea,
      schoolName: tutor.schoolName,
      graduationYear: tutor.graduationYear,
      bio: tutor.bio,
      availability: tutor.availability,
      totalClassesAccepted: tutor.totalClassesAccepted ?? 0,
      classesAcceptedThisMonth: tutor.classesAcceptedThisMonth ?? 0,
      averageRating: tutor.averageRating ?? 0,
      reviewCount: tutor.reviewCount ?? 0,
      // Huy hiệu "Gia sư uy tín" — service set true cho top theo điểm Bayesian.
      isTrusted: false,
      status: tutor.status,
      rejectionReason: tutor.rejectionReason,
      ...documents,
      createdAt: tutor.createdAt,
      updatedAt: tutor.updatedAt,
    };
  }

  static async toDTOList(tutors, options = {}) {
    if (!Array.isArray(tutors)) return [];
    const cache = { provinces: new Map(), districts: new Map() };
    return Promise.all(tutors.map((tutor) => TutorMapper.toDTO(tutor, null, cache, options)));
  }

  static async _getProvince(code, cache) {
    if (code == null) return null;
    if (cache) {
      if (cache.provinces.has(code)) return cache.provinces.get(code);
      const province = await locationRepository.findProvinceByCode(code);
      cache.provinces.set(code, province);
      return province;
    }
    return locationRepository.findProvinceByCode(code);
  }

  static async _getDistrict(code, cache) {
    if (code == null) return null;
    if (cache) {
      if (cache.districts.has(code)) return cache.districts.get(code);
      const district = await locationRepository.findDistrictByCode(code);
      cache.districts.set(code, district);
      return district;
    }
    return locationRepository.findDistrictByCode(code);
  }

  static async _resolveTeachingAreas(teachingAreas, cache = null) {
    if (!teachingAreas || !teachingAreas.province) return null;

    const province = await TutorMapper._getProvince(teachingAreas.province, cache);

    let districts = [];
    if (teachingAreas.districts && Array.isArray(teachingAreas.districts)) {
      districts = await Promise.all(
        teachingAreas.districts.map(async (code) => {
          const d = await TutorMapper._getDistrict(code, cache);
          return { code, name: d?.name || null };
        })
      );
    }

    return {
      province: teachingAreas.province,
      provinceName: province?.name || null,
      districts,
    };
  }

  static async _resolveCurrentArea(currentArea, cache = null) {
    if (!currentArea || !currentArea.province || !currentArea.district) return null;

    const [province, district] = await Promise.all([
      TutorMapper._getProvince(currentArea.province, cache),
      TutorMapper._getDistrict(currentArea.district, cache),
    ]);

    return {
      province: currentArea.province,
      district: currentArea.district,
      provinceName: province?.name || null,
      districtName: district?.name || null,
    };
  }
}

module.exports = TutorMapper;
