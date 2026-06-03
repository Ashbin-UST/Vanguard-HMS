const User = require("../models/Users");
const Employee = require("../models/Employees");
const medicalFields = new Set([
    "DOCTOR",
    "NURSE",
    "LAB_TECH",
    "PHARMACIST"
]);

const validateUniqueEmployeeFields = async (data) => {
    const{
        email,
        designation,
        medicalRegistrationNumber
    } = data;

    const existingUserEmail = await User.findOne({
        email
    });
    if (existingUserEmail) {
        return {
            success: false,
            status: 409,
            message: "User with this email already exists"
        };
    }
    const existingEmployeeEmail = await Employee.findOne({
        email
    });
    if (existingEmployeeEmail) {
        return {
            success: false,
            status: 409,
            message: "Employee with this email already exists"
        };
    }

    if (medicalFields.has(designation)){
        const existingMedicalRegistrationNumber = await Employee.findOne({
            medicalRegistrationNumber
        });
        if (existingMedicalRegistrationNumber){
            return {
                success: false,
                status: 409,
                message: "Employee with this medical registration number already exists"
            };
        }
    }
    return {
        success: true
    };
}

module.exports = validateUniqueEmployeeFields;