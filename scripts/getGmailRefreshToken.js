/**
 * Lấy GMAIL_REFRESH_TOKEN một lần để gửi email qua Gmail API.
 *
 * Chuẩn bị trong Google Cloud Console (cùng project với Google Login):
 *   1. APIs & Services → Library → bật "Gmail API".
 *   2. OAuth consent screen → thêm scope: https://www.googleapis.com/auth/gmail.send
 *      → thêm tài khoản Gmail sẽ gửi vào "Test users" (và nên Publish "In production"
 *        để refresh token không hết hạn sau 7 ngày).
 *   3. Credentials → mở OAuth client (Web application) → Authorized redirect URIs
 *      → thêm: http://localhost:5555/oauth2callback
 *
 * Chạy:  node scripts/getGmailRefreshToken.js
 * Mở URL hiện ra, đăng nhập đúng tài khoản Gmail sẽ gửi, đồng ý quyền.
 * Script in ra GMAIL_REFRESH_TOKEN → dán vào .env (và biến môi trường trên Render).
 */
require("dotenv").config();
const http = require("http");
const { OAuth2Client } = require("google-auth-library");

const PORT = 5555;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("Thiếu GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET trong .env");
  process.exit(1);
}

const oAuth2Client = new OAuth2Client(clientId, clientSecret, REDIRECT_URI);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline", // bắt buộc để nhận refresh_token
  prompt: "consent", // ép cấp lại refresh_token mỗi lần chạy
  scope: SCOPES,
});

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith("/oauth2callback")) {
    res.writeHead(404).end();
    return;
  }
  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    res.end(`Lỗi xác thực: ${error || "không nhận được code"}. Đóng tab và thử lại.`);
    server.close();
    return;
  }

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    res.end("Lấy token thành công! Quay lại terminal để copy GMAIL_REFRESH_TOKEN.");
    if (tokens.refresh_token) {
      console.log("\n✅ GMAIL_REFRESH_TOKEN=" + tokens.refresh_token + "\n");
    } else {
      console.log(
        "\n⚠️ Không có refresh_token (Google chỉ trả lần đầu). Vào https://myaccount.google.com/permissions" +
          " gỡ quyền ứng dụng rồi chạy lại script.\n",
      );
    }
  } catch (err) {
    console.error("Đổi code lấy token thất bại:", err.message);
  } finally {
    server.close();
  }
});

server.listen(PORT, () => {
  console.log("\nMở URL sau trong trình duyệt, đăng nhập tài khoản Gmail sẽ dùng để gửi:\n");
  console.log(authUrl + "\n");
});
