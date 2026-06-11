const AppError = require("../utils/AppError");
const STATUS = require("../constants/statusCodes");
const MESSAGES = require("../constants/messages");

// Single point of truth for the error wire envelope:
//   { success: false, statusCode, message, errors?: [...] }
const sendError = (res, statusCode, message, errors) => {
    const body = {
        success: false,
        statusCode,
        message
    };
    if (errors?.length) {
        body.errors = errors;
    }
    return res.status(statusCode).json(body);
};

// Global error handler. Express 5 forwards both sync throws and rejected
// promises from any handler/middleware here, so controllers stay free of
// response-sending try/catch blocks. Must keep all 4 args to be registered
// as error middleware.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {

    if (res.headersSent) {
        return next(err);
    }

    // Operational errors thrown by our own code
    if (err instanceof AppError) {
        return sendError(res, err.statusCode, err.message, err.errors);
    }

    // Malformed JSON body rejected by express.json()
    if (err.type === "entity.parse.failed") {
        return sendError(res, STATUS.BAD_REQUEST, MESSAGES.COMMON.INVALID_JSON);
    }

    // Mongoose schema validation failures
    if (err.name === "ValidationError") {
        const errors = Object.values(err.errors || {}).map((e) => ({
            msg: e.message,
            path: e.path
        }));
        return sendError(res, STATUS.UNPROCESSABLE_ENTITY, MESSAGES.COMMON.VALIDATION_FAILED, errors);
    }

    // Mongoose bad ObjectId / cast failures
    if (err.name === "CastError") {
        return sendError(res, STATUS.BAD_REQUEST, MESSAGES.COMMON.VALIDATION_FAILED);
    }

    // MongoDB duplicate key violations
    if (err.code === 11000) {
        return sendError(res, STATUS.CONFLICT, MESSAGES.COMMON.DUPLICATE_KEY);
    }

    // Unknown/unexpected error: log the full stack server-side but send an
    // opaque message so internals are never leaked to clients.
    console.error("Unhandled error:", err);
    return sendError(res, STATUS.INTERNAL_SERVER_ERROR, MESSAGES.COMMON.INTERNAL_ERROR);
};

module.exports = errorHandler;
module.exports.sendError = sendError;
