const defineLazyExport = (target, key, modulePath) => {
  Object.defineProperty(target, key, {
    enumerable: true,
    get: () => require(modulePath),
  });
};

const validations = {};

defineLazyExport(validations, "authValidation", "./auth.validation");
defineLazyExport(validations, "classValidation", "./class.validation");
defineLazyExport(validations, "tutorValidation", "./tutor.validation");
defineLazyExport(validations, "userValidation", "./user.validation");
defineLazyExport(validations, "adminValidation", "./admin.validation");

module.exports = validations;
