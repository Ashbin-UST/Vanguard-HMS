const { validationResult } = require("express-validator");
const AppError = require("../utils/AppError");
const STATUS = require("../constants/statusCodes");
const MESSAGES = require("../constants/messages");

// Turns express-validator failures into a 422 AppError carrying the
// field-level error array; the global error handler shapes the envelope.
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new AppError(
      STATUS.UNPROCESSABLE_ENTITY,
      MESSAGES.COMMON.VALIDATION_FAILED,
      errors.array()
    );
  }

  next();
};

module.exports = validate;
