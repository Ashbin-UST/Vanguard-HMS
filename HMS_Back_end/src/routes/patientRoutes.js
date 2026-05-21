const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const authorizeDesignation = require("../middlewares/authorizeDesignations")
const controller = require("../controllers/patientController");

// All routes require authentication and receptionist authorization
router.use(auth, authorizeDesignation("OWNER", "ADMIN", "RECEPTIONIST"));

const allowedGenders = new Set([
    "Male",
    "Female"
]);

const createPatientValidation = [
    body("name")
        .notEmpty()
        .withMessage("Patient name is required"),

    body("phone")
        .matches(/^\d{10}$/)
        .withMessage("Phone number must contain exactly 10 digits"),

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
        .matches(/^\d{10}$/)
        .withMessage("Emergency contact number must contain exactly 10 digits")
];

router.post(
    "/create-patient",
    createPatientValidation,
    validate,
    controller.createPatient
);

module.exports = router;