class AttendanceMapper {
  static toUserBriefDTO(userDoc) {
    if (!userDoc || typeof userDoc !== "object" || !userDoc._id) return null;
    return {
      id: userDoc._id,
      fullName: userDoc.fullName || "",
      email: userDoc.email || "",
      avatar: userDoc.avatar || null,
      phone: userDoc.phone || null,
    };
  }

  static toPeriodDTO(periodDoc, weeksBreakdown = []) {
    if (!periodDoc) return null;
    return {
      id: periodDoc._id,
      classId: periodDoc.classId?._id ?? periodDoc.classId,
      applicationId: periodDoc.applicationId?._id ?? periodDoc.applicationId,
      tutorId: periodDoc.tutorId?._id ?? periodDoc.tutorId,
      tutorUserId: periodDoc.tutorUserId?._id ?? periodDoc.tutorUserId,
      posterId: periodDoc.posterId?._id ?? periodDoc.posterId,
      periodNumber: periodDoc.periodNumber,
      anchorDay: periodDoc.anchorDay,
      startDate: periodDoc.startDate,
      endDate: periodDoc.endDate,
      sessionsPerWeek: periodDoc.sessionsPerWeek,
      minutesPerSession: periodDoc.minutesPerSession,
      monthlyTarget: periodDoc.monthlyTarget,
      status: periodDoc.status,
      stats: {
        week1Count: periodDoc.stats?.week1Count || 0,
        week2Count: periodDoc.stats?.week2Count || 0,
        week3Count: periodDoc.stats?.week3Count || 0,
        week4Count: periodDoc.stats?.week4Count || 0,
        extraDaysCount: periodDoc.stats?.extraDaysCount || 0,
        totalValidCount: periodDoc.stats?.totalValidCount || 0,
        needsReviewCount: periodDoc.stats?.needsReviewCount || 0,
      },
      weeks: weeksBreakdown,
      createdAt: periodDoc.createdAt,
      updatedAt: periodDoc.updatedAt,
    };
  }

  static toSessionDTO(sessionDoc) {
    if (!sessionDoc) return null;
    const classPopulated =
      sessionDoc.classId && typeof sessionDoc.classId === "object" && sessionDoc.classId.classCode
        ? {
            id: sessionDoc.classId._id,
            classCode: sessionDoc.classId.classCode,
            subject: sessionDoc.classId.subject,
            summary: sessionDoc.classId.summary,
            sessionsPerWeek: sessionDoc.classId.sessionsPerWeek,
            minutesPerSession: sessionDoc.classId.minutesPerSession,
            status: sessionDoc.classId.status,
          }
        : null;

    const adminOverride = sessionDoc.adminOverride?.isOverridden
      ? {
          isOverridden: true,
          overriddenBy: AttendanceMapper.toUserBriefDTO(sessionDoc.adminOverride.overriddenBy) || {
            id: sessionDoc.adminOverride.overriddenBy,
          },
          overriddenAt: sessionDoc.adminOverride.overriddenAt,
          action: sessionDoc.adminOverride.action,
          reason: sessionDoc.adminOverride.reason,
          verifiedDurationMinutes: sessionDoc.adminOverride.verifiedDurationMinutes,
        }
      : { isOverridden: false };

    const disputeResolution = sessionDoc.dispute?.resolution?.resolvedBy
      ? {
          resolvedBy: AttendanceMapper.toUserBriefDTO(sessionDoc.dispute.resolution.resolvedBy) || {
            id: sessionDoc.dispute.resolution.resolvedBy,
          },
          resolvedAt: sessionDoc.dispute.resolution.resolvedAt,
          decision: sessionDoc.dispute.resolution.decision,
          verifiedDurationMinutes: sessionDoc.dispute.resolution.verifiedDurationMinutes,
          notes: sessionDoc.dispute.resolution.notes,
          history: sessionDoc.dispute.resolution.history || [],
        }
      : null;

    return {
      id: sessionDoc._id,
      periodId: sessionDoc.periodId?._id ?? sessionDoc.periodId,
      classId: sessionDoc.classId?._id ?? sessionDoc.classId,
      classInfo: classPopulated,
      applicationId: sessionDoc.applicationId,
      tutorId: sessionDoc.tutorId,
      tutorUserId: sessionDoc.tutorUserId?._id ?? sessionDoc.tutorUserId,
      tutorUser: AttendanceMapper.toUserBriefDTO(sessionDoc.tutorUserId),
      posterId: sessionDoc.posterId?._id ?? sessionDoc.posterId,
      posterUser: AttendanceMapper.toUserBriefDTO(sessionDoc.posterId),
      sessionNumber: sessionDoc.sessionNumber,
      targetWeek: sessionDoc.targetWeek,
      checkInAt: sessionDoc.checkInAt,
      confirmedCheckInAt: sessionDoc.confirmedCheckInAt,
      checkOutAt: sessionDoc.checkOutAt,
      confirmedCheckOutAt: sessionDoc.confirmedCheckOutAt,
      checkInExpireAt: sessionDoc.checkInExpireAt,
      checkOutExpireAt: sessionDoc.checkOutExpireAt,
      checkInPhoto: sessionDoc.checkInPhoto?.url
        ? {
            url: sessionDoc.checkInPhoto.url,
            uploadedAt: sessionDoc.checkInPhoto.uploadedAt,
          }
        : null,
      checkOutPhoto: sessionDoc.checkOutPhoto?.url
        ? {
            url: sessionDoc.checkOutPhoto.url,
            uploadedAt: sessionDoc.checkOutPhoto.uploadedAt,
          }
        : null,
      durationMinutes: sessionDoc.durationMinutes || 0,
      requiredMinutes: sessionDoc.requiredMinutes,
      status: sessionDoc.status,
      rejectionReason: sessionDoc.rejectionReason || null,
      failureReason: sessionDoc.failureReason || null,
      adminOverride,
      dispute: {
        isDisputed: Boolean(sessionDoc.dispute?.isDisputed),
        requestedBy: AttendanceMapper.toUserBriefDTO(sessionDoc.dispute?.requestedBy),
        requestedByRole: sessionDoc.dispute?.requestedByRole || null,
        requestedAt: sessionDoc.dispute?.requestedAt || null,
        reason: sessionDoc.dispute?.reason || null,
        evidenceUrls: sessionDoc.dispute?.evidenceUrls || [],
        status: sessionDoc.dispute?.status || "none",
        resolution: disputeResolution,
      },
      createdAt: sessionDoc.createdAt,
      updatedAt: sessionDoc.updatedAt,
    };
  }

  static toSessionDTOList(docs) {
    if (!Array.isArray(docs)) return [];
    return docs.map((d) => AttendanceMapper.toSessionDTO(d));
  }
}

module.exports = AttendanceMapper;
