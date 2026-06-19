const defineLazyExport = (target, key, modulePath) => {
  Object.defineProperty(target, key, {
    enumerable: true,
    get: () => require(modulePath),
  });
};

const mappers = {};

defineLazyExport(mappers, "ClassMapper", "./class.mapper");
defineLazyExport(mappers, "ClassApplicationMapper", "./class.application.mapper");
defineLazyExport(mappers, "NotificationMapper", "./notification.mapper");
defineLazyExport(mappers, "TutorMapper", "./tutor.mapper");
defineLazyExport(mappers, "UserMapper", "./user.mapper");

module.exports = mappers;
