const { body } = require("express-validator");
const {
    appointmentIdValidation,
    cancelAppointmentValidation
} = require("./appointmentValidators");

// Booking/rescheduling fields for a patient. patientId is taken from the token,
// so it is NOT accepted in the body (this is the only difference from the staff
// createAppointmentValidation).
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

// The appointmentId-param and cancellation-reason rules are identical to the
// staff appointment routes, so reuse them instead of redefining.
module.exports = {
    patientBookAppointmentValidation,
    patientAppointmentIdValidation: appointmentIdValidation,
    patientCancelAppointmentValidation: cancelAppointmentValidation
};
