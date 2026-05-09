class NotificationMapper {
  static toDTO(notification) {
    if (!notification) {
      throw new Error("NotificationMapper.toDTO: notification is required");
    }

    return {
      id: notification._id,
      type: notification.type,
      message: notification.message,
      read: notification.read,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }

  static toDTOList(notifications) {
    if (!Array.isArray(notifications)) {
      return [];
    }
    return notifications.map(NotificationMapper.toDTO);
  }
}

module.exports = NotificationMapper;
