const TUTOR_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// VN mobile: 84xxxxxxxxx hoặc 0xxxxxxxxx, đầu số 3/5/7/8/9
const PHONE_REGEX = /^(84|0)(3|5|7|8|9)[0-9]{8}$/;

// HH:mm 24h zero-padded
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

module.exports = {
  TUTOR_STATUS,
  DAYS_OF_WEEK,
  PHONE_REGEX,
  TIME_REGEX,
};
