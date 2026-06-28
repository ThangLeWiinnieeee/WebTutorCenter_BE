const MESSAGE = require("./message");
const HTTP_STATUS = require("./status");
const ROLES = require("./role");
const ACCOUNT_TYPE = require("./accountType");
const OTP_TYPE = require("./otpType");
const OCCUPATION_STATUS = require("./occupationStatus");
const {
  TUTOR_STATUS,
  GENDER_OPTIONS,
  TUTOR_LEVEL_OPTIONS,
  DAYS_OF_WEEK,
  PHONE_REGEX,
  TIME_REGEX,
} = require("./tutor");
const { CLASS_STATUS } = require("./class");
const { CLASS_APPLICATION_STATUS, CLASS_APPLICATION_ORIGIN } = require("./classApplication");
const { PROFILE_CHANGE_STATUS } = require("./profileChangeRequest");
const { NOTIFICATION_TYPES } = require("./notification");
const { CHAT_ROLES } = require("./chat");

module.exports = {
  MESSAGE,
  HTTP_STATUS,
  ROLES,
  ACCOUNT_TYPE,
  OTP_TYPE,
  OCCUPATION_STATUS,
  TUTOR_STATUS,
  GENDER_OPTIONS,
  TUTOR_LEVEL_OPTIONS,
  DAYS_OF_WEEK,
  PHONE_REGEX,
  TIME_REGEX,
  CLASS_STATUS,
  CLASS_APPLICATION_STATUS,
  CLASS_APPLICATION_ORIGIN,
  PROFILE_CHANGE_STATUS,
  NOTIFICATION_TYPES,
  CHAT_ROLES,
};
