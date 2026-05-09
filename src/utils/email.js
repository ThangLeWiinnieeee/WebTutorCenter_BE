const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const sendOtpEmail = async ({ to, fullName, otp, expiresInMinutes }) => {
  const mailOptions = {
    from: `"WebTutorCenter" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Xác thực email - Mã OTP của bạn",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #1d4ed8; margin-bottom: 4px;">WebTutorCenter</h2>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin-bottom: 20px;" />

        <p style="font-size: 15px; color: #374151;">Xin chào <strong>${fullName}</strong>,</p>
        <p style="font-size: 15px; color: #374151;">
          Cảm ơn bạn đã đăng ký tài khoản. Vui lòng sử dụng mã OTP dưới đây để xác thực email:
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <span style="
            display: inline-block;
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 12px;
            color: #1d4ed8;
            background: #eff6ff;
            padding: 16px 32px;
            border-radius: 8px;
            border: 1px dashed #93c5fd;
          ">${otp}</span>
        </div>

        <p style="font-size: 14px; color: #6b7280;">
          Mã OTP có hiệu lực trong <strong>${expiresInMinutes} phút</strong>. Không chia sẻ mã này với bất kỳ ai.
        </p>
        <p style="font-size: 14px; color: #6b7280;">
          Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 24px;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          © ${new Date().getFullYear()} WebTutorCenter. All rights reserved.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendForgotPasswordOtpEmail = async ({ to, fullName, otp, expiresInMinutes }) => {
  const mailOptions = {
    from: `"WebTutorCenter" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Khôi phục mật khẩu - Mã OTP của bạn",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #dc2626; margin-bottom: 4px;">WebTutorCenter</h2>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin-bottom: 20px;" />

        <p style="font-size: 15px; color: #374151;">Xin chào <strong>${fullName}</strong>,</p>
        <p style="font-size: 15px; color: #374151;">
          Chúng tôi nhận được yêu cầu <strong>khôi phục mật khẩu</strong> cho tài khoản của bạn.
          Vui lòng sử dụng mã OTP dưới đây:
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <span style="
            display: inline-block;
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 12px;
            color: #dc2626;
            background: #fef2f2;
            padding: 16px 32px;
            border-radius: 8px;
            border: 1px dashed #fca5a5;
          ">${otp}</span>
        </div>

        <p style="font-size: 14px; color: #6b7280;">
          Mã OTP có hiệu lực trong <strong>${expiresInMinutes} phút</strong>. Không chia sẻ mã này với bất kỳ ai.
        </p>
        <p style="font-size: 14px; color: #6b7280;">
          Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này. Mật khẩu của bạn sẽ không thay đổi.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 24px;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          © ${new Date().getFullYear()} WebTutorCenter. All rights reserved.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail, sendForgotPasswordOtpEmail };
