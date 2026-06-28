const mongoose = require("mongoose");
const { CHAT_ROLES } = require("../constants/chat");

// Mỗi người dùng (gia sư hoặc học viên) có duy nhất một cuộc trò chuyện với "phía admin"
// (bất kỳ admin nào cũng đọc/trả lời được). Vì vậy conversation được khóa theo `tutorUserId`.
const conversationSchema = new mongoose.Schema(
  {
    tutorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "tutorUserId là bắt buộc"],
      unique: true,
      index: true,
    },
    // Bản xem trước tin nhắn gần nhất (để hiển thị danh sách không cần join Message).
    lastMessage: {
      type: String,
      default: "",
      trim: true,
      maxlength: [2000, "Nội dung tin nhắn không được vượt quá 2000 ký tự"],
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    lastSenderRole: {
      type: String,
      enum: [...Object.values(CHAT_ROLES), null],
      default: null,
    },
    // Số tin nhắn chưa đọc theo từng phía.
    tutorUnread: {
      type: Number,
      default: 0,
      min: 0,
    },
    adminUnread: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Sắp xếp danh sách hội thoại của admin theo hoạt động gần nhất.
conversationSchema.index({ lastMessageAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = { Conversation };
