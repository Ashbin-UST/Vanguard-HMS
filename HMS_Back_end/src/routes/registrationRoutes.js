const express = require("express");
const router = express.Router();

const { body } = require("express-validator");

const validate = require("../middlewares/validate");

// const controller = require("../controllers/registrationController");

const allowedDesignationTypes = [
    "DOCTOR",
    "RECEPTIONIST",
    "CASHIER",
    "NURSE",
    "LAB_TECH",
    "PHARMACIST"
];

const allowedDepartmentTypes = [
    "OPD",
    "IPD",
    "Lab",
    "Pharmacy",
    "Administration",
    "Reception",
    "Billing"
];

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
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),

    body("department")
        .isIn(allowedDepartmentTypes)
        .withMessage("Valid department is required"),

    body("designation")
        .isIn(allowedDesignationTypes)
        .withMessage("Valid designation is required"),

    body("joiningDate")
        .notEmpty()
        .withMessage("Joining date is required"),

    body("qualification")
        .isArray({ min: 1 })
        .withMessage("At least one qualification is required"),

    body("medicalRegistrationNumber")
        .if((value, { req }) =>
            ["DOCTOR", "NURSE", "LAB_TECH", "PHARMACIST"]
                .includes(req.body.designation)
        )
        .notEmpty()
        .withMessage("Medical registration number is required"),

    body("specialization")
        .if((value, { req }) =>
            ["DOCTOR", "LAB_TECH"]
                .includes(req.body.designation)
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
    validate
);

module.exports = router;