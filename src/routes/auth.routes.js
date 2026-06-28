const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const { authValidation } = require("../validations");
const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  googleLoginSchema,
  verifyForgotPasswordOtpSchema,
  resetPasswordSchema,
  validate,
} = authValidation;
const authMiddleware = require("../middlewares/auth.middleware");

// Đăng ký
router.post("/register", validate(registerSchema), authController.register);
router.post("/verify-otp", validate(verifyOtpSchema), authController.verifyOtp);
router.post("/resend-otp", validate(resendOtpSchema), authController.resendOtp);

// Đăng nhập / Đăng xuất
router.post("/google", validate(googleLoginSchema), authController.googleLogin);
router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", authMiddleware, authController.logout);
router.post("/refresh-token", authController.refreshToken);

// Quên mật khẩu
router.post("/forgot-password", validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/verify-forgot-password-otp", validate(verifyForgotPasswordOtpSchema), authController.verifyForgotPasswordOtp);
router.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
