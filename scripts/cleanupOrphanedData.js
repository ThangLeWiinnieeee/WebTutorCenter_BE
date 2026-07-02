/**
 * Cleanup script: xóa dữ liệu "mồ côi" (orphaned) — các bản ghi tham chiếu tới
 * người dùng (hoặc gia sư/lớp/hội thoại) ĐÃ BỊ XÓA VĨNH VIỄN khỏi DB.
 *
 * Bối cảnh: các bản purge cũ chưa dọn hết dữ liệu phụ thuộc, để lại bài đăng,
 * hội thoại, đánh giá... với chủ nhân không còn tồn tại → FE hiển thị "Người dùng đã xóa".
 * Script này quét toàn bộ và xóa những bản ghi đó. Logic purge mới (trashAdmin.service.js)
 * đã dọn đầy đủ nên đây chỉ là dọn dẹp một lần cho dữ liệu tồn đọng.
 *
 * LƯU Ý: chỉ coi là mồ côi khi user KHÔNG còn document nào trong collection `users`.
 * User xóa MỀM (deletedAt != null) vẫn còn document → KHÔNG bị đụng tới (còn khôi phục được).
 *
 * Chạy thử (không xóa gì, chỉ in số lượng):
 *   node -r ./scripts/_atlasDns.js scripts/cleanupOrphanedData.js
 * Xóa thật:
 *   node -r ./scripts/_atlasDns.js scripts/cleanupOrphanedData.js --apply
 * Xóa thật + dọn luôn ảnh trên Cloudinary (best-effort):
 *   node -r ./scripts/_atlasDns.js scripts/cleanupOrphanedData.js --apply --images
 *
 * Yêu cầu: file .env có MONGODB_URI (và CLOUDINARY_* nếu dùng --images).
 */

require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../src/models/user.model");
const Class = require("../src/models/class.model");
const Tutor = require("../src/models/tutor.model");
const Review = require("../src/models/review.model");
const { Conversation } = require("../src/models/conversation.model");
const { Message } = require("../src/models/message.model");
const { ClassApplication } = require("../src/models/class.application.model");
const Promo = require("../src/models/promo.model");
const { Notification } = require("../src/models/notification.model");
const ProfileChangeRequest = require("../src/models/profileChangeRequest.model");
const { deleteImagesFromCloudinary } = require("../src/utils/upload");

const APPLY = process.argv.includes("--apply");
const WITH_IMAGES = process.argv.includes("--images");

// Lấy tập _id (dạng chuỗi) đang tồn tại của một collection để so khớp tham chiếu.
const idSet = async (Model) => {
  const docs = await Model.find({}, { _id: 1 }).lean();
  return new Set(docs.map((d) => String(d._id)));
};

// Tìm các document có trường tham chiếu KHÔNG nằm trong tập id hợp lệ.
const findOrphans = (docs, refField, validIds) =>
  docs.filter((d) => !d[refField] || !validIds.has(String(d[refField])));

async function run() {
  console.log(`Connecting to MongoDB... (mode: ${APPLY ? "APPLY (sẽ xóa)" : "DRY-RUN (chỉ xem)"})`);
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected.\n");

  const imageUrls = [];
  const summary = {};

  // ── Tập id hợp lệ hiện tại (user xóa mềm vẫn tính là còn tồn tại) ──
  const userIds = await idSet(User);

  // 1) Gia sư có userId trỏ tới user đã biến mất
  const tutors = await Tutor.find({}, { _id: 1, userId: 1, cccdFrontImage: 1, cccdBackImage: 1, studentCardFrontImage: 1, studentCardBackImage: 1, certificateImages: 1 }).lean();
  const orphanTutors = findOrphans(tutors, "userId", userIds);
  const orphanTutorIds = new Set(orphanTutors.map((t) => String(t._id)));
  summary.tutors = orphanTutors.length;
  for (const t of orphanTutors) {
    imageUrls.push(t.cccdFrontImage, t.cccdBackImage, t.studentCardFrontImage, t.studentCardBackImage, ...(t.certificateImages || []));
  }

  // 2) Bài đăng (lớp) có createdBy trỏ tới user đã biến mất
  const classes = await Class.find({}, { _id: 1, createdBy: 1 }).lean();
  const orphanClasses = findOrphans(classes, "createdBy", userIds);
  const orphanClassIds = new Set(orphanClasses.map((c) => String(c._id)));
  summary.classes = orphanClasses.length;

  // 3) Hội thoại có tutorUserId trỏ tới user đã biến mất
  const conversations = await Conversation.find({}, { _id: 1, tutorUserId: 1 }).lean();
  const orphanConversations = findOrphans(conversations, "tutorUserId", userIds);
  const orphanConversationIds = new Set(orphanConversations.map((c) => String(c._id)));
  summary.conversations = orphanConversations.length;

  // Tập gia sư / lớp / hội thoại còn HỢP LỆ sau khi loại bỏ orphan (để cascade).
  const validTutorIds = new Set(tutors.map((t) => String(t._id)).filter((id) => !orphanTutorIds.has(id)));
  const validClassIds = new Set(classes.map((c) => String(c._id)).filter((id) => !orphanClassIds.has(id)));
  const validConversationIds = new Set(conversations.map((c) => String(c._id)).filter((id) => !orphanConversationIds.has(id)));

  // 4) Đơn nhận lớp trỏ tới gia sư HOẶC lớp đã biến mất/mồ côi
  const applications = await ClassApplication.find({}, { _id: 1, tutorId: 1, classId: 1 }).lean();
  const orphanApplications = applications.filter(
    (a) => !validTutorIds.has(String(a.tutorId)) || !validClassIds.has(String(a.classId))
  );
  summary.classApplications = orphanApplications.length;

  // 5) Đánh giá do user đã biến mất viết, HOẶC về gia sư mồ côi
  const reviews = await Review.find({}, { _id: 1, reviewerId: 1, tutorId: 1 }).lean();
  const orphanReviews = reviews.filter(
    (r) => !userIds.has(String(r.reviewerId)) || !validTutorIds.has(String(r.tutorId))
  );
  summary.reviews = orphanReviews.length;

  // 6) Tin nhắn do user đã biến mất gửi, HOẶC thuộc hội thoại mồ côi
  const messages = await Message.find({}, { _id: 1, senderId: 1, conversationId: 1, imageUrl: 1 }).lean();
  const orphanMessages = messages.filter(
    (m) => !userIds.has(String(m.senderId)) || !validConversationIds.has(String(m.conversationId))
  );
  summary.messages = orphanMessages.length;
  for (const m of orphanMessages) if (m.imageUrl) imageUrls.push(m.imageUrl);

  // 7) Voucher cá nhân của user đã biến mất
  const promos = await Promo.find({ ownerUserId: { $ne: null } }, { _id: 1, ownerUserId: 1 }).lean();
  const orphanPromos = findOrphans(promos, "ownerUserId", userIds);
  summary.promos = orphanPromos.length;

  // 8) Thông báo của user đã biến mất
  const notifications = await Notification.find({}, { _id: 1, userId: 1 }).lean();
  const orphanNotifications = findOrphans(notifications, "userId", userIds);
  summary.notifications = orphanNotifications.length;

  // 9) Yêu cầu đổi hồ sơ của user đã biến mất
  const pcrs = await ProfileChangeRequest.find({}, { _id: 1, userId: 1 }).lean();
  const orphanPcrs = findOrphans(pcrs, "userId", userIds);
  summary.profileChangeRequests = orphanPcrs.length;

  // ── In báo cáo ──
  const total = Object.values(summary).reduce((a, b) => a + b, 0);
  console.log("Dữ liệu mồ côi tìm thấy:");
  for (const [k, v] of Object.entries(summary)) console.log(`  - ${k}: ${v}`);
  console.log(`  => Tổng: ${total} bản ghi | ${imageUrls.filter(Boolean).length} ảnh Cloudinary\n`);

  if (total === 0) {
    console.log("Không có gì để dọn. Kết thúc.");
    await mongoose.disconnect();
    return;
  }

  if (!APPLY) {
    console.log("DRY-RUN: chưa xóa gì. Chạy lại với --apply để xóa thật.");
    await mongoose.disconnect();
    return;
  }

  // ── Thực hiện xóa ──
  const del = (Model, ids) => (ids.length ? Model.deleteMany({ _id: { $in: ids } }) : Promise.resolve());
  const ids = (arr) => arr.map((d) => d._id);

  await Promise.all([
    del(Tutor, ids(orphanTutors)),
    del(Class, ids(orphanClasses)),
    del(Conversation, ids(orphanConversations)),
    del(ClassApplication, ids(orphanApplications)),
    del(Review, ids(orphanReviews)),
    del(Message, ids(orphanMessages)),
    del(Promo, ids(orphanPromos)),
    del(Notification, ids(orphanNotifications)),
    del(ProfileChangeRequest, ids(orphanPcrs)),
  ]);
  console.log(`Đã xóa ${total} bản ghi mồ côi khỏi DB.`);

  if (WITH_IMAGES) {
    const urls = imageUrls.filter(Boolean);
    if (urls.length) {
      console.log(`Đang xóa ${urls.length} ảnh trên Cloudinary (best-effort)...`);
      await deleteImagesFromCloudinary(urls);
      console.log("Đã gửi yêu cầu xóa ảnh.");
    }
  } else if (imageUrls.filter(Boolean).length) {
    console.log(`(Bỏ qua ${imageUrls.filter(Boolean).length} ảnh Cloudinary — thêm --images để xóa luôn.)`);
  }

  console.log("\nHoàn tất dọn dẹp.");
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Cleanup failed:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
