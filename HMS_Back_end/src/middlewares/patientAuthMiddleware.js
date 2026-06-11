const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const STATUS = require("../constants/statusCodes");
const MESSAGES = require("../constants/messages");

// Authenticates a patient JWT; rejects employee tokens so the auth domains stay separate
const authenticatePatient = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        throw new AppError(STATUS.UNAUTHORIZED, MESSAGES.AUTH.NO_TOKEN);
    }

    const token = authHeader.split(" ")[1];

    let decoded;

    // jwt.verify throwing is expected control flow for bad/expired tokens
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    }
    catch {
        throw new AppError(STATUS.UNAUTHORIZED, MESSAGES.AUTH.INVALID_TOKEN);
    }

    if (decoded.type !== "PATIENT" || !decoded.patientId) {
        throw new AppError(STATUS.UNAUTHORIZED, MESSAGES.AUTH.INVALID_TOKEN);
    }

    req.patient = { patientId: decoded.patientId };

    next();
};

module.exports = authenticatePatient;
