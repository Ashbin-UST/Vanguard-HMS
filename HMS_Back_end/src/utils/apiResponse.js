// Single point of truth for the success wire envelope:
//   { success: true, statusCode, message, data: {...} }
// Every 2xx response in the API must be sent through sendSuccess so the
// envelope can never drift between endpoints.
const sendSuccess = (res, statusCode, message, data = {}) =>
    res.status(statusCode).json({
        success: true,
        statusCode,
        message,
        data
    });

module.exports = { sendSuccess };