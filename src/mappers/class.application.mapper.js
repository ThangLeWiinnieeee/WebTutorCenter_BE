const { CLASS_APPLICATION_STATUS } = require("../models/class.application.model");

class ClassApplicationMapper {
  static toDTO(application) {
    if (!application) return null;

    const classItem = application.classId || {};
    const tutor = application.tutorId || {};
    const tutorUser = tutor.userId || {};

    return {
      id: application._id,
      status: application.status,
      rejectionReason: application.rejectionReason ?? null,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      classItem: {
        id: classItem._id,
        classCode: classItem.classCode,
        subject: classItem.subject,
        locationLabel: classItem.locationLabel,
        feePerSession: classItem.feePerSession,
        feePerMonth: classItem.feePerMonth,
        sessionsPerWeek: classItem.sessionsPerWeek,
        minutesPerSession: classItem.minutesPerSession,
        contactPhone: classItem.contactPhone,
        description: classItem.description,
        studentGender: classItem.studentGender,
        studentCount: classItem.studentCount,
        startDate: classItem.startDate,
        availabilitySlots: classItem.availabilitySlots ?? [],
        tutorGenderPref: classItem.tutorGenderPref,
        tutorLevelPref: classItem.tutorLevelPref,
        provinceCode: classItem.provinceCode,
        districtCode: classItem.districtCode,
        provinceName: classItem.provinceName,
        districtName: classItem.districtName,
      },
      tutor: {
        id: tutor._id,
        fullName: tutorUser.fullName ?? null,
        email: tutorUser.email ?? null,
        avatar: tutorUser.avatar ?? null,
        gender: tutorUser.gender ?? null,
        subjects: tutor.subjects ?? [],
        phone: tutor.phone ?? null,
        occupationStatus: tutor.occupationStatus ?? null,
        schoolName: tutor.schoolName ?? null,
        graduationYear: tutor.graduationYear ?? null,
        bio: tutor.bio ?? null,
        availability: tutor.availability ?? [],
      },
    };
  }

  static toDTOs(applications) {
    if (!Array.isArray(applications)) return [];
    return applications.map((a) => this.toDTO(a));
  }

  /**
   * DTO cho gia sư xem các lớp mình đã nhận.
   * Chỉ khi đơn đã được CHẤP NHẬN (approved) mới trả về thông tin chi tiết/riêng tư
   * của lớp (SĐT liên hệ, mô tả đầy đủ, khung giờ cụ thể). Các trạng thái khác chỉ
   * trả về thông tin công khai.
   */
  static toMineDTO(application) {
    if (!application) return null;

    const classItem = application.classId || {};
    const isUnlocked = application.status === CLASS_APPLICATION_STATUS.APPROVED;

    const publicInfo = {
      id: classItem._id,
      classCode: classItem.classCode,
      subject: classItem.subject,
      summary: classItem.summary,
      locationLabel: isUnlocked
        ? classItem.locationLabel
        : `${classItem.districtName || ""}, ${classItem.provinceName || ""}`.replace(/^, /, ""),
      feePerSession: classItem.feePerSession,
      feePerMonth: classItem.feePerMonth,
      sessionsPerWeek: classItem.sessionsPerWeek,
      minutesPerSession: classItem.minutesPerSession,
      studentCount: classItem.studentCount,
      studentGender: classItem.studentGender,
      startDate: classItem.startDate,
      tutorGenderPref: classItem.tutorGenderPref,
      tutorLevelPref: classItem.tutorLevelPref,
      provinceName: classItem.provinceName,
      districtName: classItem.districtName,
      createdAt: classItem.createdAt,
    };

    const privateInfo = isUnlocked
      ? {
          description: classItem.description,
          contactPhone: classItem.contactPhone,
          availabilitySlots: classItem.availabilitySlots ?? [],
          provinceCode: classItem.provinceCode,
          districtCode: classItem.districtCode,
          locationLabel: classItem.locationLabel,
        }
      : {};

    return {
      id: application._id,
      status: application.status,
      rejectionReason: application.rejectionReason ?? null,
      isUnlocked,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      classItem: { ...publicInfo, ...privateInfo },
    };
  }

  static toMineDTOs(applications) {
    if (!Array.isArray(applications)) return [];
    return applications.map((a) => this.toMineDTO(a));
  }
}

module.exports = ClassApplicationMapper;
