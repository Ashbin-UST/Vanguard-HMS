const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const authorizeDesignation = require("../middlewares/authorizeDesignations");
const controller = require("../controllers/patientController");

// Phone: optional country code (+ 1 to 3 digits) followed by exactly 10 digits
const PHONE_REGEX = /^\+\d{1,3}\d{10}$/;

// All routes require authentication and reception-level authorization
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
        .matches(PHONE_REGEX)
        .withMessage(
            "Phone must include a country code (e.g. +91) followed by exactly 10 digits"
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
            "Phone must include a country code (e.g. +91) followed by exactly 10 digits"
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

const uhidValidation = [
    param("UHID")
        .notEmpty()
        .withMessage("UHID is required")
];

// Create patient
router.post(
    "/create-patient",
    createPatientValidation,
    validate,
    controller.createPatient
);

// Search patients (must precede /:UHID to avoid route capture)
router.get(
    "/search",
    controller.searchPatients
);

// List patients
router.get(
    "/",
    controller.getPatients
);

// Get a single patient
router.get(
    "/:UHID",
    uhidValidation,
    validate,
    controller.getPatientById
);

// Update a patient
router.put(
    "/:UHID",
    updatePatientValidation,
    validate,
    controller.updatePatient
);

module.exports = router;
