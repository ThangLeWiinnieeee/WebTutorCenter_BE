require("dotenv").config();
const app = require("./app");
const connectDB = require("./src/configs/database");

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });
});
