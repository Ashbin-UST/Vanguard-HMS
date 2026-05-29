const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const authorizeDesignation = require("../middlewares/authorizeDesignations");
const controller = require("../controllers/appointmentController");

// All appointment routes require authentication
router.use(auth);

// Reception-level access: book, list, view, cancel
const RECEPTION_LEVEL = authorizeDesignation(
    "OWNER",
    "ADMIN",
    "RECEPTIONIST"
);

// Doctor-level access: own appointments + completing them
const DOCTOR_LEVEL = authorizeDesignation("DOCTOR");

// Anyone who can view appointments (reception staff + doctors)
const VIEW_LEVEL = authorizeDesignation(
    "OWNER",
    "ADMIN",
    "RECEPTIONIST",
    "DOCTOR"
);

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

const bookedSlotsValidation = [
    query("doctorEmployeeId")
        .notEmpty()
        .withMessage("doctorEmployeeId is required"),

    query("date")
        .isISO8601()
        .withMessage("Valid date is required")
];

const appointmentIdValidation = [
    param("appointmentId")
        .notEmpty()
        .withMessage("Appointment id is required")
];

// Create appointment (reception level)
router.post(
    "/create-appointment",
    RECEPTION_LEVEL,
    createAppointmentValidation,
    validate,
    controller.createAppointment
);

// Doctor's own appointments
router.get(
    "/my",
    DOCTOR_LEVEL,
    controller.getMyAppointments
);

// Booked slots for a doctor on a date (reception level)
router.get(
    "/booked-slots",
    RECEPTION_LEVEL,
    bookedSlotsValidation,
    validate,
    controller.getBookedSlots
);

// List all appointments (view level)
router.get(
    "/",
    VIEW_LEVEL,
    controller.getAppointments
);

// Get a single appointment (view level)
router.get(
    "/:appointmentId",
    VIEW_LEVEL,
    appointmentIdValidation,
    validate,
    controller.getAppointmentById
);

// Cancel appointment (reception level)
router.put(
    "/:appointmentId/cancel",
    RECEPTION_LEVEL,
    appointmentIdValidation,
    validate,
    controller.cancelAppointment
);

// Complete appointment (doctor level)
router.put(
    "/:appointmentId/complete",
    DOCTOR_LEVEL,
    appointmentIdValidation,
    validate,
    controller.completeAppointment
);

module.exports = router;
