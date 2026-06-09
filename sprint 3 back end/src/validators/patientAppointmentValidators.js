const { body, param } = require("express-validator");

// Booking/rescheduling fields for a patient. patientId is taken from the token,
// so it is NOT accepted in the body.
const patientBookAppointmentValidation = [
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

// Validates the appointmentId URL parameter
const patientAppointmentIdValidation = [
    param("appointmentId")
        .notEmpty()
        .withMessage("Appointment id is required")
];

// appointmentId param plus the required cancellation reason
const patientCancelAppointmentValidation = [
    param("appointmentId")
        .notEmpty()
        .withMessage("Appointment id is required"),

    body("cancellationReason")
        .trim()
        .notEmpty()
        .withMessage("Cancellation reason is required")
];

module.exports = {
    patientBookAppointmentValidation,
    patientAppointmentIdValidation,
    patientCancelAppointmentValidation
};
