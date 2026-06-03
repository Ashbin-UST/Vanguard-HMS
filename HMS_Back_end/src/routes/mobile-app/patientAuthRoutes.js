const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const validate = require("../../middlewares/validate");
const controller = require("../../controllers/mobile-app/patientAuthController");
const patientAuth  = require("../../middlewares/patientAuthMiddleware")

const PHONE_REGEX = /^(\+\d{1,3} )?\d{10}$/;

const registerValidation = [
    body("name")
        .notEmpty()
        .withMessage("Patient name is required"),

    body("phone")
        .matches(PHONE_REGEX)
        .withMessage(
            "Phone must be 10 digits, optionally prefixed with a country code and a space"
        ),

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

    body("gender")
        .isIn(["Male", "Female"])
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
        .withMessage("Emergency contact number must be valid")
];

const loginValidation = [
    body("email")
        .isEmail()
        .withMessage("Valid email is required"),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
];

router.post(
    "/register",
    registerValidation,
    validate,
    controller.registerPatient
);

router.post(
    "/login",
    loginValidation,
    validate,
    controller.loginPatient
); 
router.get(
    "/me",
    patientAuth,
    controller.getPatientProfile
)

module.exports = router;