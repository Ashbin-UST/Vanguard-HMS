const jwt = require("jsonwebtoken");
const PatientUser = require("../models/PatientUser");

const patientAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Access denied. No token provided"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "PATIENT") {
            return res.status(403).json({
                message: "Access denied. Patient access only"
            });
        }

        const patientUser = await PatientUser.findOne({
            patientUHID: decoded.patientUHID,
            status: "ACTIVE"
        });

        if (!patientUser) {
            return res.status(401).json({
                message: "Invalid or inactive patient account"
            });
        }

        req.patientUser = patientUser;
        req.patient = {
            patientUHID: decoded.patientUHID,
            email: decoded.email,
            role: decoded.role
        };

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

module.exports = patientAuth;