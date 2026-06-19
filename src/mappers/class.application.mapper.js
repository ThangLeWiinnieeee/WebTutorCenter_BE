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
      },
      tutor: {
        id: tutor._id,
        fullName: tutorUser.fullName ?? null,
        email: tutorUser.email ?? null,
        avatar: tutorUser.avatar ?? null,
        subjects: tutor.subjects ?? [],
        phone: tutor.phone ?? null,
        occupationStatus: tutor.occupationStatus ?? null,
      },
    };
  }

  static toDTOs(applications) {
    if (!Array.isArray(applications)) return [];
    return applications.map((a) => this.toDTO(a));
  }
}

module.exports = ClassApplicationMapper;
