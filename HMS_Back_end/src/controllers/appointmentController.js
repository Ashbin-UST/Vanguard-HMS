const User = require("../models/Users");
const Employee = require("../models/Employees");
const sendEmail = require("../utils/sendEmail");
const Appointment = require("../models/Appointments");
const checkAppointmentValidity = require("../utils/checkAppointmentValidity");

// Create Appointment
exports.createAppointment = async (req, res) => {

    try {
        const {
            patientId,
            doctorEmployeeId,
            appointmentDate,
            timeSlot
        } = req.body;

        // Appointment Validation
        const validAppointment = await checkAppointmentValidity({
            patientId,
            doctorId: doctorEmployeeId,
            appointmentDate,
            timeSlot
        });

        if (!validAppointment.success) {
            return res.status(validAppointment.status).json({
                message: validAppointment.message
            });
        }

        const appointment = await Appointment.create({
            patientId,
            doctorEmployeeId,
            appointmentDate,
            timeSlot,
            createdByEmployeeId: req.user.employeeCode
        });

        // Send email AFTER successful appointment creation
        try {
            await sendEmail({
                to: validAppointment.patient.email,

                subject: "Appointment Scheduled",

                html: `
          <h2>Welcome to HMS</h2>

          <p>
            Your appointment has been created successfully.
          </p>

          <p>
            <strong>Patient Name:</strong>
            ${validAppointment.patient.name}
          </p>

          <p>
            <strong>Doctor Name:</strong>
            ${validAppointment.doctor.name}
          </p>

          <p>
            <strong>Appointment Date:</strong>
            ${appointmentDate}
          </p>

          <p>
            <strong>Time Slot:</strong>
            ${timeSlot}
          </p>

          <p>
            Regards,
            <br />
            HMS Team
          </p>
        `,
            });
        } catch (emailError) {
            console.error("Email sending error:", emailError);
        }

        return res.status(201).json({
            message: "Appointment created successfully",
            appointment
        });

    }
    catch (err) {
        console.error("Error during appointment creation: ", err);
        return res.status(500).json({
            message: "Server error during appointment creation"
        });
    }
}

