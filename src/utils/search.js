// Tiện ích tìm kiếm: tạo regex khớp KHÔNG dấu và KHÔNG phân biệt hoa/thường.
// Người dùng gõ "toan" hay "Toán" đều khớp "Toán"; "ha noi" khớp "Hà Nội".
//
// Cách làm: bỏ dấu từ khóa rồi thay mỗi nguyên âm/ d cơ sở bằng một character class
// gồm mọi biến thể có dấu (cả hoa lẫn thường). Nhờ vậy không phụ thuộc vào việc engine
// regex của MongoDB có case-fold ký tự Unicode hay không.

// Nhóm biến thể tiếng Việt theo từng ký tự cơ sở (chữ thường, gồm cả ký tự gốc).
const DIACRITIC_GROUPS = {
  a: "aàáảãạăằắẳẵặâầấẩẫậ",
  e: "eèéẻẽẹêềếểễệ",
  i: "iìíỉĩị",
  o: "oòóỏõọôồốổỗộơờớởỡợ",
  u: "uùúủũụưừứửữự",
  y: "yỳýỷỹỵ",
  d: "dđ",
};

// Map mỗi ký tự cơ sở (cả hoa lẫn thường) → chuỗi character class gồm mọi biến thể (cả 2 case).
const CHAR_CLASS = {};
for (const [base, variants] of Object.entries(DIACRITIC_GROUPS)) {
  const all = variants + variants.toUpperCase();
  CHAR_CLASS[base] = all;
  CHAR_CLASS[base.toUpperCase()] = all;
}

// Escape ký tự đặc biệt của RegExp.
const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Bỏ dấu tiếng Việt khỏi chuỗi (NFD + xóa dấu kết hợp + đ→d).
const removeDiacritics = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

// Tạo chuỗi pattern (chưa neo đầu/cuối) khớp không dấu + không phân biệt hoa/thường.
const buildDiacriticInsensitivePattern = (keyword) => {
  const base = removeDiacritics(String(keyword).trim()).toLowerCase();
  let out = "";
  for (const ch of base) {
    out += CHAR_CLASS[ch] ? `[${CHAR_CLASS[ch]}]` : escapeRegExp(ch);
  }
  return out;
};

// RegExp khớp một phần (substring), không dấu + không phân biệt hoa/thường.
const diacriticInsensitiveRegex = (keyword) =>
  new RegExp(buildDiacriticInsensitivePattern(keyword), "i");

// RegExp khớp chính xác toàn chuỗi, không dấu + không phân biệt hoa/thường.
const diacriticInsensitiveExactRegex = (keyword) =>
  new RegExp(`^${buildDiacriticInsensitivePattern(keyword)}$`, "i");

module.exports = {
  escapeRegExp,
  removeDiacritics,
  buildDiacriticInsensitivePattern,
  diacriticInsensitiveRegex,
  diacriticInsensitiveExactRegex,
};
