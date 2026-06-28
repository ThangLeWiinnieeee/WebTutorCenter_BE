const { Server } = require("socket.io");
const { verifyAccessToken } = require("../utils/token");
const corsOptions = require("./cors");
const ROLES = require("../constants/role");

let io = null;

const userRoom = (userId) => `user:${userId}`;
const ADMIN_ROOM = "admins";

// Khởi tạo Socket.IO trên cùng HTTP server với Express.
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: corsOptions.origin,
      credentials: true,
    },
  });

  // Xác thực bằng access token (gửi qua handshake.auth.token), tái dùng JWT của REST.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Thiếu token xác thực"));
      socket.data.user = verifyAccessToken(token);
      next();
    } catch (err) {
      next(new Error("Token không hợp lệ"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    if (!user?.id) return socket.disconnect(true);

    // Mỗi user vào phòng riêng để nhận tin gửi đích danh; admin vào thêm phòng chung.
    socket.join(userRoom(user.id));
    if (user.role === ROLES.ADMIN) socket.join(ADMIN_ROOM);
  });

  return io;
};

const getIO = () => io;

// Helper phát sự kiện — an toàn khi io chưa khởi tạo (vd môi trường test).
const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  io.to(userRoom(userId)).emit(event, payload);
};

const emitToAdmins = (event, payload) => {
  if (!io) return;
  io.to(ADMIN_ROOM).emit(event, payload);
};

module.exports = { initSocket, getIO, emitToUser, emitToAdmins };
