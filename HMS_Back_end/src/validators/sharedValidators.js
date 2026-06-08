const { body } = require("express-validator");

// Reusable express-validator builders for fields common to BOTH employees and
// patients (name, phone, email). Domain-specific fields stay in their own
// validator files. Each builder accepts the body path so it can target nested
// fields (e.g. "emergencyContact.contactName"), and an { optional } flag so the
// same rule can be reused for partial-update routes.

// ---- name ----------------------------------------------------------------

// Allowed name format: must start with a letter (any language), then letters,
// spaces, hyphens, apostrophes and periods. Covers names like "Jean-Luc",
// "O'Brien", "Dr. John" and accented names such as "José".
const NAME_REGEX = /^\p{L}[\p{L} .'-]*$/u;

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 50;

// `field`    - body path to validate (e.g. "name", "emergencyContact.contactName")
// `label`    - used in the error messages (e.g. "Patient name")
// `optional` - when true, validation is skipped if the field is absent (for updates)
const nameValidator = (field = "name", label = "Name", { optional = false } = {}) => {
  const chain = body(field);
  if (optional) {
    chain.optional();
  }
  return chain
    .trim()
    .notEmpty()
    .withMessage(`${label} is required`)
    .bail()
    .isLength({ min: NAME_MIN_LENGTH, max: NAME_MAX_LENGTH })
    .withMessage(`${label} must be between ${NAME_MIN_LENGTH} and ${NAME_MAX_LENGTH} characters`)
    .matches(NAME_REGEX)
    .withMessage(
      `${label} may only contain letters, spaces, hyphens, apostrophes and periods`,
    );
};

// ---- phone ---------------------------------------------------------------

// Optional country code (+ then 1-3 digits) and a space, then exactly 10 digits.
// Accepts "+91 1234567890" or "1234567890".
const PHONE_REGEX = /^(\+\d{1,3} )?\d{10}$/;

const PHONE_DEFAULT_MESSAGE =
  "Phone must be 10 digits, optionally prefixed with a country code and a space (e.g. +91 1234567890 or 1234567890)";

// `field`    - body path to validate (e.g. "phone", "emergencyContact.contactNumber")
// `optional` - skip when the field is absent (for updates)
// `message`  - override the default error message
const phoneValidator = (
  field = "phone",
  { optional = false, message = PHONE_DEFAULT_MESSAGE } = {},
) => {
  const chain = body(field);
  if (optional) {
    chain.optional();
  }
  return chain.matches(PHONE_REGEX).withMessage(message);
};

// ---- email ---------------------------------------------------------------

// `optional` - skip when the field is absent (for updates)
const emailValidator = (field = "email", { optional = false } = {}) => {
  const chain = body(field);
  if (optional) {
    chain.optional();
  }
  return chain.isEmail().withMessage("Valid email is required");
};

module.exports = {
  nameValidator,
  phoneValidator,
  emailValidator,
  NAME_REGEX,
  PHONE_REGEX,
  NAME_MIN_LENGTH,
  NAME_MAX_LENGTH,
};
