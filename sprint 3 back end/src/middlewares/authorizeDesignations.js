const Employee = require("../models/Employees");

const authorizeDesignation = (...allowedDesignations) => {

    return async (req, res, next) => {

        // Ensure user exists
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized access"
            });
        }

        // Ensure employee exists
        const employee = await Employee.findOne({
            employeeCode: req.user.employeeCode
        });

        if (!employee) {
            return res.status(403).json({
                message: "Unauthorized access"
            });
        }

        // Check if employee has at least one allowed designation
        const hasPermission = allowedDesignations.includes(employee.designation)

        if (!hasPermission) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        next();
    };
};

module.exports = authorizeDesignation;