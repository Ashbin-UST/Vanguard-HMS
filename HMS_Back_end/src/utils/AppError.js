// Operational (expected) error thrown anywhere in the request pipeline and
// translated into an HTTP response by the global error handler middleware.
class AppError extends Error {

    /**
     * @param {number} statusCode 4xx/5xx HTTP status for the response
     * @param {string} message    user-facing message from the catalog
     * @param {Array}  [errors]   optional field-level error array (validation)
     */
    constructor(statusCode, message, errors = undefined) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.errors = errors;
        // Marks errors we threw on purpose, as opposed to programmer bugs
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
