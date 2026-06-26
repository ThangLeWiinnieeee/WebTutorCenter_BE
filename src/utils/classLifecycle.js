const classRepository = require("../repositories/class.repository");
const classApplicationRepository = require("../repositories/class.application.repository");
const notificationService = require("../services/notification.service");
const { NOTIFICATION_TYPES } = require("../models/notification.model");
const { CLASS_STATUS } = require("../models/class.model");

const EXPIRY_INTERVAL_MS = 15 * 60 * 1000; // quét mỗi 15 phút
const FIRST_RUN_DELAY_MS = 15 * 1000; // chạy lần đầu sau 15s để DB ổn định

// Đánh dấu hết hạn các bài đăng đã tới giờ học mà chưa có gia sư nhận, và báo cho người đăng.
// Bỏ qua các lớp đang có đơn (pending/approved/cancel_requested) — vẫn còn cơ hội được ghép.
const expireOverdueClasses = async () => {
  const activeClassIds = await classApplicationRepository.distinctActiveClassIds();
  const classes = await classRepository.findExpirableClasses(new Date(), activeClassIds);

  let expired = 0;
  for (const cls of classes) {
    await classRepository.updateStatus(cls._id, CLASS_STATUS.EXPIRED);
    const posterId = cls.createdBy?._id ?? cls.createdBy;
    if (posterId) {
      await notificationService.createNotification({
        userId: posterId,
        type: NOTIFICATION_TYPES.CLASS_EXPIRED,
        message: `Rất tiếc, lớp ${cls.classCode} (Môn: ${cls.subject}) đã tới thời gian bắt đầu nhưng chưa có gia sư nào nhận. Bạn vui lòng tạo bài đăng mới hoặc liên hệ admin để được hỗ trợ.`,
      });
    }
    expired += 1;
  }
  return expired;
};

let running = false;
const runExpirySweep = async () => {
  if (running) return; // tránh chạy chồng nếu lần trước chưa xong
  running = true;
  try {
    const count = await expireOverdueClasses();
    if (count > 0) console.log(`[classLifecycle] Đã đánh dấu hết hạn ${count} bài đăng.`);
  } catch (err) {
    console.error("[classLifecycle] Lỗi khi quét bài đăng hết hạn:", err.message);
  } finally {
    running = false;
  }
};

const startClassLifecycleScheduler = () => {
  setTimeout(runExpirySweep, FIRST_RUN_DELAY_MS);
  const timer = setInterval(runExpirySweep, EXPIRY_INTERVAL_MS);
  if (typeof timer.unref === "function") timer.unref(); // không giữ tiến trình sống chỉ vì timer
  return timer;
};

module.exports = { expireOverdueClasses, runExpirySweep, startClassLifecycleScheduler };
