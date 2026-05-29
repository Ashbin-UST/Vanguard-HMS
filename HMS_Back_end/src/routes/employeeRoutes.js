const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const authorizeDesignation = require("../middlewares/authorizeDesignations");
const controller = require("../controllers/employeeController");

// Phone: optional country code (+ 1 to 3 digits) followed by exactly 10 digits
const PHONE_REGEX = /^(\+\d{1,3} )?\d{10}$/;

// All employee routes require authentication
router.use(auth);

const profileUpdateValidation = [
    body("phone")
        .optional()
        .matches(PHONE_REGEX)
        .withMessage(
            "Phone must be 10 digits, optionally prefixed with a country code and a space (e.g. +91 1234567890 or 1234567890)"
        ),

    body("qualification")
        .optional()
        .isArray({ min: 1 })
        .withMessage("At least one qualification is required")
];

// Current authenticated user + profile
router.get(
    "/me",
    controller.getMe
);

// Logged-in employee's profile
router.get(
    "/profile",
    controller.getProfile
);

// Active doctors list (for appointment booking dropdown)
router.get(
    "/doctors",
    authorizeDesignation("OWNER", "ADMIN", "RECEPTIONIST"),
    controller.getDoctors
);

// Submit a profile change request (admin approval required)
router.put(
    "/update-profile",
    profileUpdateValidation,
    validate,
    controller.requestProfileUpdate
);

module.exports = router;
