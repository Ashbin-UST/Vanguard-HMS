const jwt = require("jsonwebtoken");

// Authenticate a patient from their JWT.
// Patient tokens are signed with { patientId, type: "PATIENT" }; this rejects
// employee tokens (which carry employeeCode/roles) so the two auth domains stay
// separate.
const authenticatePatient = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "No token provided"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== "PATIENT" || !decoded.patientId) {
            return res.status(401).json({
                message: "Invalid or expired token"
            });
        }

        req.patient = { patientId: decoded.patientId };

        next();
    }
    catch (err) {
        console.error("Error:", err);
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

module.exports = authenticatePatient;
