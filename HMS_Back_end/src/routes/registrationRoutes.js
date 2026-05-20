const express = require("express");
const router = express.Router();

const { body } = require("express-validator");

const validate = require("../middlewares/validate");

const controller = require("../controllers/registrationController");

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

const registerRequestValidation = [

    body("username")
        .notEmpty()
        .withMessage("Username is required"),

    body("name")
        .notEmpty()
        .withMessage("Name is required"),

    body("phone")
        .notEmpty()
        .withMessage("Phone number is required"),

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
        .notEmpty()
        .withMessage("Joining date is required"),

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

router.post(
    "/register-request",
    registerRequestValidation,
    validate,
    controller.registerEmployee
);

module.exports = router;