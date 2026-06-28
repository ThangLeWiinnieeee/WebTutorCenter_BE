const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const routes = require("./src/routes/index");
const errorMiddleware = require("./src/middlewares/error.middleware");
const corsOptions = require("./src/configs/cors");

const app = express();

// Tắt ETag: response JSON từ API không dùng cache 304. Nếu bật, client có thể nhận 304
// với thân rỗng; axios coi 200-304 là thành công nhưng `response.data` rỗng -> lỗi parse / mất user.
app.set("etag", false);

app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api", routes);

app.use(errorMiddleware);

module.exports = app;
