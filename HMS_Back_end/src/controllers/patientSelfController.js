const Patient = require("../models/Patients");
const Employee = require("../models/Employees");
const User = require("../models/Users");
const Appointment = require("../models/Appointments");
const sendEmail = require("../utils/sendEmail");
const emailTemplates = require("../utils/emailTemplates");
const checkAppointmentValidity = require("../validators/checkAppointmentValidity");
const enrichAppointments = require("../utils/enrichAppointments");
const listAppointments = require("../utils/listAppointments");
const parsePagination = require("../utils/parsePagination");
const recordAudit = require("../utils/recordAudit");
const { toSafePatient, PATIENT_SAFE_PROJECTION } = require("../utils/toSafePatient");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/apiResponse");
const STATUS = require("../constants/statusCodes");
const MESSAGES = require("../constants/messages");

// Build an audit actor for a patient (resolveActor assumes an employee, so we
// construct one directly here).
const patientActor = (patient) => ({
    employeeCode: patient.UHID,
    name: patient.name,
    designation: "PATIENT"
});

// Get the authenticated patient's own profile
exports.getMyProfile = async (req, res) => {

    const patient = await Patient.findOne({
        UHID: req.patient.patientId
    }).select(PATIENT_SAFE_PROJECTION);

    if (!patient) {
        throw new AppError(STATUS.NOT_FOUND, MESSAGES.PATIENT.NOT_FOUND);
    }

    return sendSuccess(res, STATUS.OK, MESSAGES.PATIENT.PROFILE_RETRIEVED, {
        patient
    });
};

// Update the authenticated patient's own contact details.
// Identity fields (name, gender, dob) and account fields (status, UHID,
// passwordHash) are intentionally NOT editable here.
exports.updateMyProfile = async (req, res) => {

    const patient = await Patient.findOne({
        UHID: req.patient.patientId
    });

    if (!patient) {
        throw new AppError(STATUS.NOT_FOUND, MESSAGES.PATIENT.NOT_FOUND);
    }

    // If email is changing, keep it unique across patients
    if (req.body.email && req.body.email !== patient.email) {
        const existing = await Patient.findOne({ email: req.body.email });
        if (existing) {
            throw new AppError(STATUS.CONFLICT, MESSAGES.PATIENT.EMAIL_EXISTS);
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
        message: MESSAGES.AUDIT.PATIENT_PROFILE_UPDATED(patient.name, patient.UHID)
    });

    return sendSuccess(res, STATUS.OK, MESSAGES.PATIENT.PROFILE_UPDATED, {
        patient: toSafePatient(patient)
    });
};

// List active doctors for the appointment booking screen
exports.getDoctors = async (req, res) => {

    const users = await User.find({ status: "ACTIVE" }).select("employeeCode");
    const activeCodes = users.map((u) => u.employeeCode);

    const doctors = await Employee.find({
        designation: "DOCTOR",
        employeeCode: { $in: activeCodes }
    }).select(
        "employeeCode name specialization department consultationFee availabilitySlots qualification joiningDate"
    );

    return sendSuccess(res, STATUS.OK, MESSAGES.EMPLOYEE.DOCTORS_RETRIEVED, {
        total: doctors.length,
        doctors
    });
};

// Return the list of already-booked time slots for a doctor on a given date
exports.getBookedSlots = async (req, res) => {

    const { doctorEmployeeId, date } = req.query;

    if (!doctorEmployeeId || !date) {
        throw new AppError(STATUS.BAD_REQUEST, MESSAGES.APPOINTMENT.DOCTOR_AND_DATE_REQUIRED);
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

    return sendSuccess(res, STATUS.OK, MESSAGES.APPOINTMENT.BOOKED_SLOTS_RETRIEVED, {
        doctorEmployeeId,
        date,
        bookedSlots
    });
};

// List the authenticated patient's own appointments (paginated, enriched)
exports.getMyAppointments = async (req, res) => {

    const { page, limit, skip } = parsePagination(req.query);

    const filter = { patientId: req.patient.patientId };
    if (req.query.status) {
        filter.status = req.query.status;
    }

    const [appointments, total] = await Promise.all([
        listAppointments(filter, skip, limit),
        Appointment.countDocuments(filter)
    ]);

    const enriched = await enrichAppointments(appointments);

    return sendSuccess(res, STATUS.OK, MESSAGES.APPOINTMENT.LIST_RETRIEVED, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        appointments: enriched
    });
};

// Book an appointment for the authenticated patient
exports.bookAppointment = async (req, res) => {

    const patientId = req.patient.patientId;
    const { doctorEmployeeId, appointmentDate, timeSlot } = req.body;

    // Throws AppError when any booking rule is violated
    const { patient, doctor } = await checkAppointmentValidity({
        patientId,
        doctorId: doctorEmployeeId,
        appointmentDate,
        timeSlot
    });

    const appointment = await Appointment.create({
        patientId,
        doctorEmployeeId,
        appointmentDate,
        timeSlot
    });

    // Notify the patient by email (best-effort)
    try {
        await sendEmail({
            to: patient.email,
            ...emailTemplates.appointmentScheduled({
                patientName: patient.name,
                doctorName: doctor.name,
                appointmentDate,
                timeSlot
            })
        });
    } catch (emailError) {
        console.error("Email sending error:", emailError);
    }

    await recordAudit({
        actor: patientActor(patient),
        action: "APPOINTMENT_CREATED",
        targetType: "APPOINTMENT",
        targetId: appointment.appointmentId,
        message: MESSAGES.AUDIT.APPOINTMENT_BOOKED_BY_PATIENT(
            appointment.appointmentId,
            patient.name,
            doctor.name
        )
    });

    return sendSuccess(res, STATUS.CREATED, MESSAGES.APPOINTMENT.CREATED, {
        appointment
    });
};

// Reschedule one of the patient's own BOOKED appointments
exports.updateMyAppointment = async (req, res) => {

    const patientId = req.patient.patientId;
    const { appointmentId } = req.params;
    const { doctorEmployeeId, appointmentDate, timeSlot } = req.body;

    const appointment = await Appointment.findOne({ appointmentId });

    if (!appointment) {
        throw new AppError(STATUS.NOT_FOUND, MESSAGES.APPOINTMENT.NOT_FOUND);
    }

    // A patient can only touch their own appointments
    if (appointment.patientId !== patientId) {
        throw new AppError(STATUS.FORBIDDEN, MESSAGES.APPOINTMENT.OWN_ONLY_MODIFY);
    }

    if (appointment.status !== "BOOKED") {
        throw new AppError(STATUS.BAD_REQUEST, MESSAGES.APPOINTMENT.ONLY_BOOKED_EDITABLE);
    }

    // Throws AppError when any booking rule is violated
    const { patient, doctor } = await checkAppointmentValidity({
        patientId,
        doctorId: doctorEmployeeId,
        appointmentDate,
        timeSlot,
        excludeAppointmentId: appointmentId
    });

    appointment.doctorEmployeeId = doctorEmployeeId;
    appointment.appointmentDate = appointmentDate;
    appointment.timeSlot = timeSlot;
    await appointment.save();

    // Notify the patient by email (best-effort)
    try {
        await sendEmail({
            to: patient.email,
            ...emailTemplates.appointmentUpdated({
                patientName: patient.name,
                doctorName: doctor.name,
                appointmentDate,
                timeSlot
            })
        });
    } catch (emailError) {
        console.error("Email sending error:", emailError);
    }

    await recordAudit({
        actor: patientActor(patient),
        action: "APPOINTMENT_UPDATED",
        targetType: "APPOINTMENT",
        targetId: appointment.appointmentId,
        message: MESSAGES.AUDIT.APPOINTMENT_RESCHEDULED_BY_PATIENT(
            appointment.appointmentId,
            patient.name
        )
    });

    return sendSuccess(res, STATUS.OK, MESSAGES.APPOINTMENT.UPDATED, {
        appointment
    });
};

// Cancel one of the patient's own appointments
exports.cancelMyAppointment = async (req, res) => {

    const patientId = req.patient.patientId;
    const { appointmentId } = req.params;
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findOne({ appointmentId });

    if (!appointment) {
        throw new AppError(STATUS.NOT_FOUND, MESSAGES.APPOINTMENT.NOT_FOUND);
    }

    if (appointment.patientId !== patientId) {
        throw new AppError(STATUS.FORBIDDEN, MESSAGES.APPOINTMENT.OWN_ONLY_CANCEL);
    }

    if (appointment.status === "CANCELED") {
        throw new AppError(STATUS.BAD_REQUEST, MESSAGES.APPOINTMENT.ALREADY_CANCELLED);
    }

    if (appointment.status === "COMPLETED") {
        throw new AppError(STATUS.BAD_REQUEST, MESSAGES.APPOINTMENT.COMPLETED_CANNOT_CANCEL);
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
        message: MESSAGES.AUDIT.APPOINTMENT_CANCELLED_BY_PATIENT(
            appointment.appointmentId,
            cancellationReason
        )
    });

    return sendSuccess(res, STATUS.OK, MESSAGES.APPOINTMENT.CANCELLED, {
        appointment
    });
};
