const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const authorizeDesignation = require("../middlewares/authorizeDesignations");
const controller = require("../controllers/appointmentController");

// All routes require authentication and receptionist authorization
router.use(auth, authorizeDesignation("OWNER", "ADMIN", "RECEPTIONIST"));

const createAppointmentValidation = [
    body("patientId")
        .notEmpty()
        .withMessage("Patient id is required"),

    body("doctorEmployeeId")
        .notEmpty()
        .withMessage("Doctor's employee id is required"),

    body("appointmentDate")
        .isISO8601()
        .toDate()
        .withMessage("Valid appointment date is required"),

    body("timeSlot")
        .matches(/^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage("Time slot must be in HH:mm-HH:mm format")
];

router.post(
    "/create-appointment",
    createAppointmentValidation,
    validate,
    controller.createAppointment
);

module.exports = router;