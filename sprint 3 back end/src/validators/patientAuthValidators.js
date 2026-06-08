const { body } = require("express-validator");
const {
    nameValidator,
    phoneValidator,
    emailValidator
} = require("./sharedValidators");
const { passwordStrengthValidator } = require("./passwordValidator");

const EMERGENCY_PHONE_MESSAGE =
    "Emergency contact number must include a country code followed by exactly 10 digits";

const allowedGenders = new Set(["Male", "Female"]);

// Confirms the confirmPassword field matches the given password field
const matchesPassword = (passwordField) =>
    body("confirmPassword")
        .notEmpty()
        .withMessage("Confirm password is required")
        .bail()
        .custom((value, { req }) => {
            if (value !== req.body[passwordField]) {
                throw new Error("Passwords do not match");
            }
            return true;
        });

// Full patient field set (same as staff-created patients) plus a self-chosen password
const patientRegisterValidation = [
    nameValidator("name", "Patient name"),
    phoneValidator("phone"),
    emailValidator("email"),
    passwordStrengthValidator("password"),

    body("gender")
        .isIn([...allowedGenders])
        .withMessage("Valid gender is required"),

    body("dob")
        .isISO8601()
        .toDate()
        .withMessage("Valid date of birth is required"),

    body("address.houseName").notEmpty().withMessage("House name is required"),
    body("address.houseNumber").notEmpty().withMessage("House number is required"),
    body("address.city").notEmpty().withMessage("City is required"),
    body("address.postCode").notEmpty().withMessage("Post code is required"),

    nameValidator("emergencyContact.contactName", "Emergency contact name"),
    body("emergencyContact.relationship")
        .notEmpty()
        .withMessage("Relationship is required"),
    phoneValidator("emergencyContact.contactNumber", { message: EMERGENCY_PHONE_MESSAGE })
];

// Email + password presence for login
const patientLoginValidation = [
    emailValidator("email"),
    body("password").notEmpty().withMessage("Password is required")
];

// Current password + new password strength + confirmation match
const patientChangePasswordValidation = [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    passwordStrengthValidator("newPassword"),
    matchesPassword("newPassword")
];

// Email presence for the forgot-password flow
const patientForgotPasswordValidation = [
    emailValidator("email")
];

// Reset token + new password strength + confirmation match
const patientResetPasswordValidation = [
    body("resetToken").notEmpty().withMessage("Reset token is required"),
    passwordStrengthValidator("newPassword"),
    matchesPassword("newPassword")
];

// Editable contact fields only. Identity fields (name/gender/dob) are NOT accepted.
const patientProfileUpdateValidation = [
    phoneValidator("phone", { optional: true }),
    emailValidator("email", { optional: true }),

    body("address.houseName").optional().notEmpty().withMessage("House name is required"),
    body("address.houseNumber").optional().notEmpty().withMessage("House number is required"),
    body("address.city").optional().notEmpty().withMessage("City is required"),
    body("address.postCode").optional().notEmpty().withMessage("Post code is required"),

    nameValidator("emergencyContact.contactName", "Emergency contact name", { optional: true }),
    body("emergencyContact.relationship")
        .optional()
        .notEmpty()
        .withMessage("Relationship is required"),
    phoneValidator("emergencyContact.contactNumber", {
        optional: true,
        message: EMERGENCY_PHONE_MESSAGE
    })
];

module.exports = {
    patientRegisterValidation,
    patientLoginValidation,
    patientChangePasswordValidation,
    patientForgotPasswordValidation,
    patientResetPasswordValidation,
    patientProfileUpdateValidation
};
