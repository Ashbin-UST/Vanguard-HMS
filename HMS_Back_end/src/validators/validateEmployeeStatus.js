const Employee = require("../models/Employees");
const User = require("../models/Users");

const validateEmployeeStatus = async (employeeCode, expectedDesignation) => {

    // Look up the employee record
    const employee = await Employee.findOne({
        employeeCode: employeeCode
    });

    if (!employee) {
        return {
            success: false,
            status: 404,
            message: "Employee doesn't exist"
        };
    }

    // Look up the linked user account
    const user = await User.findOne({
        employeeCode
    });

    if (!user) {
        return {
            success: false,
            status: 404,
            message: "User doesn't exist"
        };
    }

    // Confirm the employee holds the required designation
    if (employee.designation !== expectedDesignation){
        return {
            success: false,
            status: 400,
            message: "The selected employee is not a " + expectedDesignation
        };
    }

    // Confirm the user account is active
    if (String(user.status) !== "ACTIVE") {
        return {
            success: false,
            status: 403,
            message: expectedDesignation + " account is inactive"
        };
    }

    return {
        success: true,
        employee
    };
}

module.exports = validateEmployeeStatus;
