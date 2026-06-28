// Preload (-r) cho các script seed: áp dụng fix DNS để phân giải được bản ghi SRV/TXT
// của MongoDB Atlas trên máy có DNS hệ thống từ chối truy vấn (querySrv ECONNREFUSED).
// Seed scripts gọi mongoose.connect() trực tiếp (không qua src/configs/database.js) nên
// cần preload module này qua npm script: node -r ./scripts/_atlasDns.js <script>.
require("../src/configs/dns");
