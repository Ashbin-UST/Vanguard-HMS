const { body, param } = require("express-validator");
const { PHONE_REGEX } = require("./employeeValidation");

const allowedGenders = new Set([
    "Male",
    "Female"
]);

// Validates all required fields for creating a new patient record
const createPatientValidation = [
    body("name")
        .notEmpty()
        .withMessage("Patient name is required"),

    body("phone")
        .matches(PHONE_REGEX)
        .withMessage(
            "Phone must be 10 digits, optionally prefixed with a country code and a space (e.g. +91 1234567890 or 1234567890)"
        ),

    body("email")
        .isEmail()
        .withMessage("Valid email is required"),

    body("gender")
        .isIn([...allowedGenders])
        .withMessage("Valid gender is required"),

    body("dob")
        .isISO8601()
        .toDate()
        .withMessage("Valid date of birth is required"),

    body("address.houseName")
        .notEmpty()
        .withMessage("House name is required"),

    body("address.houseNumber")
        .notEmpty()
        .withMessage("House number is required"),

    body("address.city")
        .notEmpty()
        .withMessage("City is required"),

    body("address.postCode")
        .notEmpty()
        .withMessage("Post code is required"),

    body("emergencyContact.contactName")
        .notEmpty()
        .withMessage("Emergency contact name is required"),

    body("emergencyContact.relationship")
        .notEmpty()
        .withMessage("Relationship is required"),

    body("emergencyContact.contactNumber")
        .matches(PHONE_REGEX)
        .withMessage(
            "Emergency contact number must include a country code followed by exactly 10 digits"
        )
];

// Validates the UHID param and all optional body fields for patient updates
const updatePatientValidation = [
    param("UHID")
        .notEmpty()
        .withMessage("UHID is required"),

    body("name")
        .optional()
        .notEmpty()
        .withMessage("Patient name cannot be empty"),

    body("phone")
        .optional()
        .matches(PHONE_REGEX)
        .withMessage(
            "Phone must be 10 digits, optionally prefixed with a country code and a space (e.g. +91 1234567890 or 1234567890)"
        ),

    body("email")
        .optional()
        .isEmail()
        .withMessage("Valid email is required"),

    body("gender")
        .optional()
        .isIn([...allowedGenders])
        .withMessage("Valid gender is required"),

    body("dob")
        .optional()
        .isISO8601()
        .toDate()
        .withMessage("Valid date of birth is required"),

    body("status")
        .optional()
        .isIn(["ACTIVE", "INACTIVE"])
        .withMessage("Valid status is required"),

    body("emergencyContact.contactNumber")
        .optional()
        .matches(PHONE_REGEX)
        .withMessage(
            "Emergency contact number must include a country code followed by exactly 10 digits"
        )
];

// Validates the UHID URL parameter
const uhidValidation = [
    param("UHID")
        .notEmpty()
        .withMessage("UHID is required")
];

module.exports = {
    createPatientValidation,
    updatePatientValidation,
    uhidValidation
};