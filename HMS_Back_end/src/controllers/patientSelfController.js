const Patient = require("../models/Patients");
const Employee = require("../models/Employees");
const User = require("../models/Users");
const Appointment = require("../models/Appointments");
const sendEmail = require("../utils/sendEmail");
const emailTemplates = require("../utils/emailTemplates");
const checkAppointmentValidity = require("../validators/checkAppointmentValidity");
const enrichAppointments = require("../utils/enrichAppointments");
const parsePagination = require("../utils/parsePagination");
const recordAudit = require("../utils/recordAudit");
const { toSafePatient, PATIENT_SAFE_PROJECTION } = require("../utils/toSafePatient");

// Build an audit actor for a patient (resolveActor assumes an employee, so we
// construct one directly here).
const patientActor = (patient) => ({
    employeeCode: patient.UHID,
    name: patient.name,
    designation: "PATIENT"
});

// Get the authenticated patient's own profile
exports.getMyProfile = async (req, res) => {

    try {
        const patient = await Patient.findOne({
            UHID: req.patient.patientId
        }).select(PATIENT_SAFE_PROJECTION);

        if (!patient) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        return res.status(200).json({
            message: "Profile retrieved successfully",
            patient
        });
    }
    catch (err) {
        console.error("Error during patient profile retrieval: ", err);
        return res.status(500).json({
            message: "Server error while fetching profile"
        });
    }
};

// Update the authenticated patient's own contact details.
// Identity fields (name, gender, dob) and account fields (status, UHID,
// passwordHash) are intentionally NOT editable here.
exports.updateMyProfile = async (req, res) => {

    try {
        const patient = await Patient.findOne({
            UHID: req.patient.patientId
        });

        if (!patient) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        // If email is changing, keep it unique across patients
        if (req.body.email && req.body.email !== patient.email) {
            const existing = await Patient.findOne({ email: req.body.email });
            if (existing) {
                return res.status(409).json({
                    message: "Another patient with this email already exists"
                });
            }
            patient.email = req.body.email;
        }

        const editableFields = ["phone", "address", "emergencyContact"];
        editableFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                patient[field] = req.body[field];
            }
        });

        await patient.save();

        await recordAudit({
            actor: patientActor(patient),
            action: "PATIENT_UPDATED",
            targetType: "PATIENT",
            targetId: patient.UHID,
            message: `Patient ${patient.name} (${patient.UHID}) updated their profile`
        });

        return res.status(200).json({
            message: "Profile updated successfully",
            patient: toSafePatient(patient)
        });
    }
    catch (err) {
        console.error("Error during patient profile update: ", err);
        return res.status(500).json({
            message: "Server error during profile update"
        });
    }
};

// List active doctors for the appointment booking screen
exports.getDoctors = async (req, res) => {

    try {
        const users = await User.find({ status: "ACTIVE" }).select("employeeCode");
        const activeCodes = users.map((u) => u.employeeCode);

        const doctors = await Employee.find({
            designation: "DOCTOR",
            employeeCode: { $in: activeCodes }
        }).select(
            "employeeCode name specialization department consultationFee availabilitySlots qualification joiningDate"
        );

        return res.status(200).json({
            message: "Doctors retrieved successfully",
            total: doctors.length,
            doctors
        });
    }
    catch (err) {
        console.error("Error during doctors retrieval: ", err);
        return res.status(500).json({
            message: "Server error while fetching doctors"
        });
    }
};

// Return the list of already-booked time slots for a doctor on a given date
exports.getBookedSlots = async (req, res) => {

    try {
        const { doctorEmployeeId, date } = req.query;

        if (!doctorEmployeeId || !date) {
            return res.status(400).json({
                message: "doctorEmployeeId and date are required"
            });
        }

        const start = new Date(date);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const bookedSlotsFilter = {
            doctorEmployeeId,
            appointmentDate: { $gte: start, $lte: end },
            status: "BOOKED"
        };

        const { excludeAppointmentId } = req.query;
        if (excludeAppointmentId) {
            bookedSlotsFilter.appointmentId = { $ne: excludeAppointmentId };
        }

        const appointments = await Appointment.find(bookedSlotsFilter).select("timeSlot -_id");
        const bookedSlots = appointments.map((a) => a.timeSlot);

        return res.status(200).json({
            message: "Booked slots retrieved successfully",
            doctorEmployeeId,
            date,
            bookedSlots
        });
    }
    catch (err) {
        console.error("Error fetching booked slots: ", err);
        return res.status(500).json({
            message: "Server error while fetching booked slots"
        });
    }
};

// List the authenticated patient's own appointments (paginated, enriched)
exports.getMyAppointments = async (req, res) => {

    try {
        const { page, limit, skip } = parsePagination(req.query);

        const filter = { patientId: req.patient.patientId };
        if (req.query.status) {
            filter.status = req.query.status;
        }

        const [appointments, total] = await Promise.all([
            Appointment.find(filter)
                .select("-__v")
                .sort({ appointmentDate: -1, _id: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Appointment.countDocuments(filter)
        ]);

        const enriched = await enrichAppointments(appointments);

        return res.status(200).json({
            message: "Appointments retrieved successfully",
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            appointments: enriched
        });
    }
    catch (err) {
        console.error("Error during patient appointments retrieval: ", err);
        return res.status(500).json({
            message: "Server error while fetching appointments"
        });
    }
};

// Book an appointment for the authenticated patient
exports.bookAppointment = async (req, res) => {

    try {
        const patientId = req.patient.patientId;
        const { doctorEmployeeId, appointmentDate, timeSlot } = req.body;

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
            timeSlot
        });

        // Notify the patient by email (best-effort)
        try {
            await sendEmail({
                to: validAppointment.patient.email,
                ...emailTemplates.appointmentScheduled({
                    patientName: validAppointment.patient.name,
                    doctorName: validAppointment.doctor.name,
                    appointmentDate,
                    timeSlot
                })
            });
        } catch (emailError) {
            console.error("Email sending error:", emailError);
        }

        await recordAudit({
            actor: patientActor(validAppointment.patient),
            action: "APPOINTMENT_CREATED",
            targetType: "APPOINTMENT",
            targetId: appointment.appointmentId,
            message: `Appointment ${appointment.appointmentId} booked by ${validAppointment.patient.name} with ${validAppointment.doctor.name}`
        });

        return res.status(201).json({
            message: "Appointment created successfully",
            appointment
        });
    }
    catch (err) {
        console.error("Error during appointment booking: ", err);
        return res.status(500).json({
            message: "Server error during appointment booking"
        });
    }
};

// Reschedule one of the patient's own BOOKED appointments
exports.updateMyAppointment = async (req, res) => {

    try {
        const patientId = req.patient.patientId;
        const { appointmentId } = req.params;
        const { doctorEmployeeId, appointmentDate, timeSlot } = req.body;

        const appointment = await Appointment.findOne({ appointmentId });

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // A patient can only touch their own appointments
        if (appointment.patientId !== patientId) {
            return res.status(403).json({
                message: "You can only modify your own appointments"
            });
        }

        if (appointment.status !== "BOOKED") {
            return res.status(400).json({
                message: "Only BOOKED appointments can be edited"
            });
        }

        const validAppointment = await checkAppointmentValidity({
            patientId,
            doctorId: doctorEmployeeId,
            appointmentDate,
            timeSlot,
            excludeAppointmentId: appointmentId
        });

        if (!validAppointment.success) {
            return res.status(validAppointment.status).json({
                message: validAppointment.message
            });
        }

        appointment.doctorEmployeeId = doctorEmployeeId;
        appointment.appointmentDate = appointmentDate;
        appointment.timeSlot = timeSlot;
        await appointment.save();

        try {
            await sendEmail({
                to: validAppointment.patient.email,
                ...emailTemplates.appointmentUpdated({
                    patientName: validAppointment.patient.name,
                    doctorName: validAppointment.doctor.name,
                    appointmentDate,
                    timeSlot
                })
            });
        } catch (emailError) {
            console.error("Email sending error:", emailError);
        }

        await recordAudit({
            actor: patientActor(validAppointment.patient),
            action: "APPOINTMENT_UPDATED",
            targetType: "APPOINTMENT",
            targetId: appointment.appointmentId,
            message: `Appointment ${appointment.appointmentId} rescheduled by ${validAppointment.patient.name}`
        });

        return res.status(200).json({
            message: "Appointment updated successfully",
            appointment
        });
    }
    catch (err) {
        console.error("Error during appointment update: ", err);
        return res.status(500).json({
            message: "Server error during appointment update"
        });
    }
};

// Cancel one of the patient's own appointments
exports.cancelMyAppointment = async (req, res) => {

    try {
        const patientId = req.patient.patientId;
        const { appointmentId } = req.params;
        const { cancellationReason } = req.body;

        const appointment = await Appointment.findOne({ appointmentId });

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.patientId !== patientId) {
            return res.status(403).json({
                message: "You can only cancel your own appointments"
            });
        }

        if (appointment.status === "CANCELED") {
            return res.status(400).json({
                message: "Appointment is already cancelled"
            });
        }

        if (appointment.status === "COMPLETED") {
            return res.status(400).json({
                message: "Completed appointments cannot be cancelled"
            });
        }

        appointment.status = "CANCELED";
        appointment.cancellationReason = cancellationReason;
        await appointment.save();

        // Notify the patient (and surface the doctor name) by email
        try {
            const [patient, doctor] = await Promise.all([
                Patient.findOne({ UHID: appointment.patientId }).select("name email"),
                Employee.findOne({ employeeCode: appointment.doctorEmployeeId }).select("name")
            ]);
            if (patient?.email) {
                await sendEmail({
                    to: patient.email,
                    ...emailTemplates.appointmentCanceled({
                        patientName: patient.name,
                        doctorName: doctor?.name,
                        appointmentDate: appointment.appointmentDate,
                        timeSlot: appointment.timeSlot,
                        cancellationReason
                    })
                });
            }
        } catch (emailError) {
            console.error("Email sending error:", emailError);
        }

        await recordAudit({
            actor: { employeeCode: appointment.patientId, designation: "PATIENT" },
            action: "APPOINTMENT_CANCELED",
            targetType: "APPOINTMENT",
            targetId: appointment.appointmentId,
            message: `Appointment ${appointment.appointmentId} cancelled by patient. Reason: ${cancellationReason}`
        });

        return res.status(200).json({
            message: "Appointment cancelled successfully",
            appointment
        });
    }
    catch (err) {
        console.error("Error during appointment cancellation: ", err);
        return res.status(500).json({
            message: "Server error during appointment cancellation"
        });
    }
};
