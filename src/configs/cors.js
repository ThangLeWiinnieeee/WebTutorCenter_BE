// Danh sách origin được phép. CLIENT_URL có thể chứa nhiều origin, phân tách bằng dấu phẩy
// (vd: "http://localhost:4000,https://webtutor.vercel.app").
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:4000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Cho phép các bản preview deploy của Vercel (mỗi commit một URL *.vercel.app).
// Bỏ dòng này nếu muốn siết chặt chỉ đúng domain production.
const isVercelPreview = (origin) => {
  try {
    return new URL(origin).hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
};

const isAllowedOrigin = (origin) => {
  // Không có origin: request server-to-server, curl, health check của host → cho phép.
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (isVercelPreview(origin)) return true;
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    callback(new Error(`Origin không được phép bởi CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

module.exports = corsOptions;
