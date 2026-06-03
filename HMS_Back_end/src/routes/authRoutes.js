const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const controller = require("../controllers/authController");

// Phone: optional country code (+ 1 to 3 digits) followed by exactly 10 digits
const PHONE_REGEX = /^(\+\d{1,3} )?\d{10}$/;

const allowedDesignationTypes = new Set([
    "DOCTOR",
    "RECEPTIONIST",
    "CASHIER",
    "NURSE",
    "LAB_TECH",
    "PHARMACIST"
]);

const allowedDepartmentTypes = new Set([
    "OPD",
    "IPD",
    "Lab",
    "Pharmacy",
    "Administration",
    "Reception",
    "Billing"
]);

const medicalFields = new Set([
    "DOCTOR",
    "NURSE",
    "LAB_TECH",
    "PHARMACIST"
]);

const specializationFields = new Set([
    "DOCTOR",
    "LAB_TECH"
]);

const selfRegisterValidation = [



    body("name")
        .notEmpty()
        .withMessage("Name is required"),

    body("phone")
        .matches(PHONE_REGEX)
        .withMessage("Phone must be 10 digits, optionally prefixed with a country code and a space (e.g. +91 1234567890 or 1234567890)"),

    body("email")
        .isEmail()
        .withMessage("Valid email is required"),

    body("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long")
        .matches(/[A-Z]/)
        .withMessage("Password must contain at least one uppercase letter")
        .matches(/[a-z]/)
        .withMessage("Password must contain at least one lowercase letter")
        .matches(/\d/)
        .withMessage("Password must contain at least one number")
        .matches(/[^A-Za-z0-9]/)
        .withMessage("Password must contain at least one special character"),

    body("department")
        .isIn([...allowedDepartmentTypes])
        .withMessage("Valid department is required"),

    body("designation")
        .isIn([...allowedDesignationTypes])
        .withMessage("Valid designation is required"),

    body("joiningDate")
        .isISO8601()
        .toDate()
        .withMessage("Valid joining date is required"),

    body("qualification")
        .isArray({ min: 1 })
        .withMessage("At least one qualification is required"),

    body("medicalRegistrationNumber")
        .if((value, { req }) =>
            medicalFields.has(req.body.designation)
        )
        .notEmpty()
        .withMessage("Medical registration number is required"),

    body("specialization")
        .if((value, { req }) =>
            specializationFields.has(req.body.designation)
        )
        .notEmpty()
        .withMessage("Specialization is required"),

    body("consultationFee")
        .if(body("designation").equals("DOCTOR"))
        .notEmpty()
        .withMessage("Consultation fee is required for doctor"),

    body("availabilitySlots")
        .if(body("designation").equals("DOCTOR"))
        .isArray({ min: 1 })
        .withMessage("Availability slots are required for doctor")
];

const loginValidation = [

    body("email")
        .isEmail()
        .withMessage("Valid email is required"),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
];

const changePasswordValidation = [

    body("currentPassword")
        .notEmpty()
        .withMessage("Current password is required"),

    body("newPassword")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long")
        .matches(/[A-Z]/)
        .withMessage("Password must contain at least one uppercase letter")
        .matches(/[a-z]/)
        .withMessage("Password must contain at least one lowercase letter")
        .matches(/\d/)
        .withMessage("Password must contain at least one number")
        .matches(/[^A-Za-z0-9]/)
        .withMessage("Password must contain at least one special character"),

    body("confirmPassword")
        .notEmpty()
        .withMessage("Confirm password is required"),

    body("confirmPassword")
        .custom((value, { req }) => {

            if (value !== req.body.newPassword) {
                throw new Error("Passwords do not match");
            }

            return true;
        })
];

const forgotPasswordValidation = [

    body("email")
        .isEmail()
        .withMessage("Valid email is required")
];

const resetPasswordValidation = [

    body("resetToken")
        .notEmpty()
        .withMessage("Reset token is required"),

    body("newPassword")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long")
        .matches(/[A-Z]/)
        .withMessage("Password must contain at least one uppercase letter")
        .matches(/[a-z]/)
        .withMessage("Password must contain at least one lowercase letter")
        .matches(/\d/)
        .withMessage("Password must contain at least one number")
        .matches(/[^A-Za-z0-9]/)
        .withMessage("Password must contain at least one special character"),

    body("confirmPassword")
        .notEmpty()
        .withMessage("Confirm password is required"),

    body("confirmPassword")
        .custom((value, { req }) => {

            if (value !== req.body.newPassword) {
                throw new Error("Passwords do not match");
            }

            return true;
        })
];

router.post(
    "/login",
    loginValidation,
    validate,
    controller.login
);

router.post(
    "/self-register",
    selfRegisterValidation,
    validate,
    controller.selfRegister
);

router.put(
    "/change-password",
    auth,
    changePasswordValidation,
    validate,
    controller.changePassword
);

router.post(
    "/forgot-password",
    forgotPasswordValidation,
    validate,
    controller.forgotPassword
);

router.post(
    "/reset-password",
    resetPasswordValidation,
    validate,
    controller.resetPassword
);

router.post(
    "/logout",
    auth,
    controller.logout
);

router.get(
    "/me",
    auth,
    controller.me
);

module.exports = router;