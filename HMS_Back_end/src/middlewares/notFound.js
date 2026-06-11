const AppError = require("../utils/AppError");
const STATUS = require("../constants/statusCodes");
const MESSAGES = require("../constants/messages");

// Catch-all for requests that matched no route; forwards a 404 to the global
// error handler so unknown paths get the JSON envelope instead of HTML.
const notFound = (req, res, next) =>
    next(new AppError(STATUS.NOT_FOUND, MESSAGES.COMMON.ROUTE_NOT_FOUND));

module.exports = notFound;
