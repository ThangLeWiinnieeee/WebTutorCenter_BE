const SUBJECTS = require("./subject");
const OCCUPATION_STATUS = require("./occupationStatus");

const TUTOR_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const GENDER_OPTIONS = ["male", "female", "other"];
const TUTOR_LEVEL_OPTIONS = ["student", "teacher", "any"];
const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PHONE_REGEX = /^(84|0)(3|5|7|8|9)[0-9]{8}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const CLASS_STATUS = {
  OPEN: "open",
  CLOSED: "closed",
};

module.exports = {
  SUBJECTS,
  OCCUPATION_STATUS,
  TUTOR_STATUS,
  GENDER_OPTIONS,
  TUTOR_LEVEL_OPTIONS,
  DAYS_OF_WEEK,
  PHONE_REGEX,
  TIME_REGEX,
  CLASS_STATUS,
};
