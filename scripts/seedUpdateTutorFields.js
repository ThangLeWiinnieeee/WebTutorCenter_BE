require("dotenv").config();
const mongoose = require("mongoose");
const Tutor = require("../src/models/tutor.model");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✓ MongoDB connected");
  } catch (error) {
    console.error("✗ MongoDB connection failed:", error);
    process.exit(1);
  }
};

const updateTutorFields = async () => {
  try {
    console.log("🔄 Bắt đầu cập nhật fields cho tutor...");

    const result = await Tutor.updateMany(
      {},
      {
        $set: {
          totalClassesAccepted: 0,
          classesAcceptedThisMonth: 0,
        },
      }
    );

    console.log(`✓ Cập nhật ${result.modifiedCount} tutor documents`);
  } catch (error) {
    console.error("✗ Lỗi khi cập nhật:", error);
  } finally {
    await mongoose.connection.close();
    console.log("✓ MongoDB disconnected");
  }
};

const main = async () => {
  await connectDB();
  await updateTutorFields();
};

main();
