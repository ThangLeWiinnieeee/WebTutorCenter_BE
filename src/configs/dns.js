const dns = require("dns");

// Một số mạng/ISP (hay gặp trên Windows) khiến trình phân giải DNS hệ thống từ chối
// truy vấn bản ghi SRV/TXT mà MongoDB Atlas (mongodb+srv://) cần → lỗi
// "querySrv ECONNREFUSED". Ưu tiên DNS công cộng cho các truy vấn này, vẫn giữ DNS hệ
// thống làm dự phòng. Không ảnh hưởng kết nối localhost (driver dùng OS resolver cho
// hostname thường, không qua c-ares).
//
// Side-effect khi require: áp dụng ngay. Dùng ở app (database.js) và preload seed
// (scripts/_atlasDns.js).
dns.setServers([...new Set(["8.8.8.8", "1.1.1.1", ...dns.getServers()])]);

module.exports = {};
