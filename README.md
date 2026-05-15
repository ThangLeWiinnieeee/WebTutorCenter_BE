# WebTutorCenter Backend

Backend API cho hệ thống quản lý trung tâm gia sư trực tuyến. Dự án dùng Express + MongoDB theo kiến trúc layer rõ ràng: `routes -> controller -> service -> mapper -> repository -> model`.

## Tech Stack

- Node.js, Express
- MongoDB, Mongoose
- JWT access/refresh token
- Joi validation
- bcryptjs
- Nodemailer
- Google Auth Library
- Cloudinary, Multer
- cookie-parser, morgan, cors

## Yêu Cầu

- Node.js
- MongoDB
- Gmail app password nếu dùng OTP email
- Cloudinary account nếu dùng upload avatar
- Google OAuth client nếu dùng đăng nhập Google

## Cài Đặt

```bash
npm install
```

Tạo file cấu hình môi trường trong thư mục backend và điền các biến cần thiết cho server, MongoDB, JWT, email, Google OAuth, Cloudinary và CORS theo môi trường chạy của bạn.

## Chạy Dự Án

```bash
# Development
npm run dev

# Production
npm start
```

Base API:

```text
http://localhost:<PORT>/api
```

## Seed Dữ Liệu Tỉnh/Quận

Module `locations` đọc dữ liệu từ MongoDB. Chạy script seed để lấy dữ liệu từ `provinces.open-api.vn`:

```bash
node scripts/seedLocations.js
```

Script này upsert dữ liệu `Province` và `District`, có thể chạy lại khi cần cập nhật dữ liệu.

## Cấu Trúc Chính

```text
src/
├── controllers/        # Nhận req/res, gọi service, trả successResponse()
├── services/           # Logic nghiệp vụ, throw AppError
├── mappers/            # Chuyển đổi DB document → DTO (UserMapper, TutorMapper, NotificationMapper, ClassMapper)
├── repositories/       # Truy vấn MongoDB/Mongoose
├── models/             # Mongoose schema
├── validations/        # Joi schema cho request validation
├── routes/             # Khai báo endpoint và middleware, index.js mount dưới /api
├── configs/            # database, cloudinary, cors
├── constants/          # status, message, role, otpType, accountType + tutor/
├── middlewares/        # auth, role, error
└── utils/              # token, response, hash, email, otp, upload, AppError
```

Chi tiết cấu trúc xem thêm `STRUCTURE.md`.

## API Overview

### Auth - `/api/auth`

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/register` | Đăng ký tài khoản và gửi OTP |
| POST | `/verify-otp` | Xác thực OTP |
| POST | `/resend-otp` | Gửi lại OTP |
| POST | `/google` | Đăng nhập Google |
| POST | `/login` | Đăng nhập email/mật khẩu |
| POST | `/logout` | Đăng xuất |
| POST | `/refresh-token` | Refresh access token |
| POST | `/forgot-password` | Gửi OTP quên mật khẩu |
| POST | `/verify-forgot-password-otp` | Xác thực OTP quên mật khẩu |
| POST | `/reset-password` | Đặt lại mật khẩu |

### Users - `/api/users`

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/user-info` | Lấy thông tin user hiện tại |
| PATCH | `/update-profile` | Cập nhật hồ sơ cá nhân |
| POST | `/upload-avatar` | Upload avatar qua Cloudinary |

### Tutors - `/api/tutors`

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/register` | Đăng ký làm gia sư |
| GET | `/profile` | Lấy hồ sơ gia sư của user hiện tại |
| GET | `/admin/pending` | Admin lấy danh sách hồ sơ đang chờ duyệt |
| PATCH | `/admin/:id/approve` | Admin duyệt hồ sơ, chuyển role user thành tutor |
| PATCH | `/admin/:id/reject` | Admin từ chối hồ sơ |

### Locations - `/api/locations`

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/provinces` | Lấy danh sách tỉnh/thành |
| GET | `/provinces/:provinceCode/districts` | Lấy quận/huyện theo tỉnh/thành |

### Notifications - `/api/notifications`

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/` | Lấy thông báo của user hiện tại |
| PATCH | `/:id/read` | Đánh dấu một thông báo đã đọc |
| PATCH | `/read-all` | Đánh dấu tất cả thông báo đã đọc |

### Classes - `/api/classes`

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/quote` | Tính học phí dự kiến |
| POST | `/` | Đăng lớp học mới |
| GET | `/` | Lấy danh sách lớp học |
| GET | `/subjects` | Lấy danh sách môn học |
| GET | `/:id` | Lấy chi tiết lớp học |

## Luồng Nghiệp Vụ Chính

- Đăng ký tài khoản: tạo user, gửi OTP email, xác thực OTP để kích hoạt.
- Đăng nhập: trả access token, refresh token lưu trong cookie.
- Đăng ký gia sư: user gửi hồ sơ, hệ thống tạo tutor profile ở trạng thái pending và tạo notification `TUTOR_PENDING`.
- Duyệt gia sư: admin approve/reject hồ sơ; approve sẽ đổi role user thành `tutor`, đồng thời tạo notification tương ứng.
- Thông báo: lưu trong MongoDB theo `userId`; khi mark read sẽ set `readAt`, MongoDB TTL tự xóa sau 7 ngày.

## Quy Ước Code

- Controller chỉ nhận request, gọi service và trả `successResponse()`.
- Service chứa logic nghiệp vụ, gọi repository, throw `AppError` cho lỗi người dùng.
- Mapper chịu trách nhiệm chuyển đổi DB document thành DTO; service gọi mapper, không tự format response inline.
- Repository chỉ thao tác MongoDB/Mongoose.
- Joi validation đặt trong `<module>.validation.js`.
- Endpoint mới phải mount trong `src/routes/index.js` nếu tạo module mới.
- Không hardcode tỉnh/quận trong tutor constants; dùng module `locations`.
