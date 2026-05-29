const Appointment = require("../models/Appointments");
const Patient = require("../models/Patients");
const validateEmployeeStatus = require("./validateEmployeeStatus");

const checkAppointmentValidity =
    async ({
        patientId,
        doctorId,
        appointmentDate,
        timeSlot
    }) => {

        // Check for patient existence
        const patient = await Patient.findOne({
            UHID: patientId
        });

        if (!patient) {
            return {
                success: false,
                status: 404,
                message: "Patient doesn't exist"
            };
        }

        const validDoctor = await validateEmployeeStatus(doctorId, "DOCTOR");

        if (!validDoctor.success){
            return validDoctor;
        }

        const doctor = validDoctor.employee;

        // Check for doctor availability
        const appointmentDay = new Date(appointmentDate)
            .toLocaleDateString("en-US", {
                weekday: "long"
            })
            .toUpperCase();

        const matchingSlot =
            (doctor.availabilitySlots || []).find(
                (slot) => slot.day === appointmentDay
            );

        // Doctor unavailable on selected day
        if (!matchingSlot) {

            return {
                success: false,
                status: 409,
                message: "Doctor is unavailable on the selected day"
            };
        }

        const [
            appointmentStartTime,
            appointmentEndTime
        ] = timeSlot.split("-");

        // Check appointment time slot
        const isValidTimeSlot =
            appointmentStartTime >= matchingSlot.startTime &&
            appointmentEndTime <= matchingSlot.endTime;

        // Doctor unavailable for selected time slot
        if (!isValidTimeSlot) {

            return {
                success: false,
                status: 409,
                message: "Doctor is unavailable for the selected time slot"
            };
        }

        // Check patient duplicate
        const patientAppointment =
            await Appointment.findOne({
                patientId,
                appointmentDate,
                timeSlot,
                status: { $ne: "CANCELED" }
            });

        if (patientAppointment) {

            return {
                success: false,
                status: 409,
                message: "Patient already has an appointment for this time slot"
            };
        }

        // Check doctor duplicate
        const doctorAppointment =
            await Appointment.findOne({
                doctorEmployeeId: doctorId,
                appointmentDate,
                timeSlot,
                status: { $ne: "CANCELED" }
            });

        if (doctorAppointment) {

            return {
                success: false,
                status: 409,
                message: "Doctor already has an appointment for this time slot"
            };
        }

        return {
            success: true,
            patient,
            doctor
        };
    };

module.exports = checkAppointmentValidity;