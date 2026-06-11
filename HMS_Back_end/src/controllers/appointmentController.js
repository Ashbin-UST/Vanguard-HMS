const Employee = require("../models/Employees");
const Patient = require("../models/Patients");
const sendEmail = require("../utils/sendEmail");
const Appointment = require("../models/Appointments");
const checkAppointmentValidity = require("../validators/checkAppointmentValidity");
const recordAudit = require("../utils/recordAudit");
const resolveActor = require("../utils/resolveActor");
const emailTemplates = require("../utils/emailTemplates");
const parsePagination = require("../utils/parsePagination");
const enrichAppointments = require("../utils/enrichAppointments");
const listAppointments = require("../utils/listAppointments");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/apiResponse");
const STATUS = require("../constants/statusCodes");
const MESSAGES = require("../constants/messages");

// Shared pagination helper for appointment list endpoints
const paginateAppointments = async (filter, reqQuery, res) => {
    const { page, limit, skip } = parsePagination(reqQuery);

    if (reqQuery.date) {
        const start = new Date(reqQuery.date);
        const end = new Date(reqQuery.date);
        end.setHours(23, 59, 59, 999);
        filter.appointmentDate = { $gte: start, $lte: end };
    }

    // Fetch page and total in parallel, then attach patient/doctor names
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

// Create appointment
exports.createAppointment = async (req, res) => {

    const {
        patientId,
        doctorEmployeeId,
        appointmentDate,
        timeSlot
    } = req.body;

    // Validates patient, doctor availability, and slot conflicts;
    // throws AppError when any rule is violated
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
        timeSlot,
        createdByEmployeeId: req.user.employeeCode
    });

    // Notify patient by email (best-effort)
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

    // Log the appointment creation
    const actor = await resolveActor(req.user);
    await recordAudit({
        actor,
        action: "APPOINTMENT_CREATED",
        targetType: "APPOINTMENT",
        targetId: appointment.appointmentId,
        message: MESSAGES.AUDIT.APPOINTMENT_BOOKED(
            appointment.appointmentId,
            patient.name,
            doctor.name
        )
    });

    return sendSuccess(res, STATUS.CREATED, MESSAGES.APPOINTMENT.CREATED, {
        appointment
    });
};

// List all appointments with optional status/doctor/patient filters (paginated)
exports.getAppointments = async (req, res) => {

    const filter = {};

    if (req.query.status) {
        filter.status = req.query.status;
    }

    if (req.query.doctorEmployeeId) {
        filter.doctorEmployeeId = req.query.doctorEmployeeId;
    }

    if (req.query.patientId) {
        filter.patientId = req.query.patientId;
    }

    return paginateAppointments(filter, req.query, res);
};

// List appointments belonging to the authenticated doctor
exports.getMyAppointments = async (req, res) => {

    const filter = { doctorEmployeeId: req.user.employeeCode };

    if (req.query.status) {
        filter.status = req.query.status;
    }

    return paginateAppointments(filter, req.query, res);
};

// Fetch a single appointment
exports.getAppointmentById = async (req, res) => {

    const { appointmentId } = req.params;

    const appointment = await Appointment.findOne({
        appointmentId
    })
        .select("-__v")
        .lean();

    if (!appointment) {
        throw new AppError(STATUS.NOT_FOUND, MESSAGES.APPOINTMENT.NOT_FOUND);
    }

    const [enriched] = await enrichAppointments([appointment]);

    return sendSuccess(res, STATUS.OK, MESSAGES.APPOINTMENT.RETRIEVED, {
        appointment: enriched
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

    // Only BOOKED appointments occupy a slot
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

// Cancel an appointment
exports.cancelAppointment = async (req, res) => {

    const { appointmentId } = req.params;
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findOne({ appointmentId });

    if (!appointment) {
        throw new AppError(STATUS.NOT_FOUND, MESSAGES.APPOINTMENT.NOT_FOUND);
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

    // Fetch patient and doctor in parallel to build the cancellation email (best-effort)
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

    // Log appointment cancellation
    const actor = await resolveActor(req.user);
    await recordAudit({
        actor,
        action: "APPOINTMENT_CANCELED",
        targetType: "APPOINTMENT",
        targetId: appointment.appointmentId,
        message: MESSAGES.AUDIT.APPOINTMENT_CANCELLED(
            appointment.appointmentId,
            cancellationReason
        )
    });

    return sendSuccess(res, STATUS.OK, MESSAGES.APPOINTMENT.CANCELLED, {
        appointment
    });
};

// Update scheduling fields on a BOOKED appointment
exports.updateAppointment = async (req, res) => {

    const { appointmentId } = req.params;
    const {
        patientId,
        doctorEmployeeId,
        appointmentDate,
        timeSlot
    } = req.body;

    const appointment = await Appointment.findOne({ appointmentId });

    if (!appointment) {
        throw new AppError(STATUS.NOT_FOUND, MESSAGES.APPOINTMENT.NOT_FOUND);
    }

    if (appointment.status !== "BOOKED") {
        throw new AppError(STATUS.BAD_REQUEST, MESSAGES.APPOINTMENT.ONLY_BOOKED_EDITABLE);
    }

    // Re-validates with the current appointment excluded from duplicate
    // checks; throws AppError when any rule is violated
    const { patient, doctor } = await checkAppointmentValidity({
        patientId,
        doctorId: doctorEmployeeId,
        appointmentDate,
        timeSlot,
        excludeAppointmentId: appointmentId
    });

    appointment.patientId = patientId;
    appointment.doctorEmployeeId = doctorEmployeeId;
    appointment.appointmentDate = appointmentDate;
    appointment.timeSlot = timeSlot;
    await appointment.save();

    // Notify patient of the updated schedule (best-effort)
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

    // Log appointment updation
    const actor = await resolveActor(req.user);
    await recordAudit({
        actor,
        action: "APPOINTMENT_UPDATED",
        targetType: "APPOINTMENT",
        targetId: appointment.appointmentId,
        message: MESSAGES.AUDIT.APPOINTMENT_UPDATED(appointment.appointmentId)
    });

    return sendSuccess(res, STATUS.OK, MESSAGES.APPOINTMENT.UPDATED, {
        appointment
    });
};

// Mark an appointment COMPLETED
exports.completeAppointment = async (req, res) => {

    const { appointmentId } = req.params;

    const appointment = await Appointment.findOne({ appointmentId });

    if (!appointment) {
        throw new AppError(STATUS.NOT_FOUND, MESSAGES.APPOINTMENT.NOT_FOUND);
    }

    // Only the concerned doctor can mark an appointment as complete
    if (appointment.doctorEmployeeId !== req.user.employeeCode) {
        throw new AppError(STATUS.FORBIDDEN, MESSAGES.APPOINTMENT.OWN_ONLY_COMPLETE);
    }

    if (appointment.status === "CANCELED") {
        throw new AppError(STATUS.BAD_REQUEST, MESSAGES.APPOINTMENT.CANCELLED_CANNOT_COMPLETE);
    }

    if (appointment.status === "COMPLETED") {
        throw new AppError(STATUS.BAD_REQUEST, MESSAGES.APPOINTMENT.ALREADY_COMPLETED);
    }

    // Reject completion if the scheduled start time has not yet passed
    const slotStart = (appointment.timeSlot || "").split("-")[0];
    const [slotHour, slotMinute] = slotStart.split(":").map(Number);
    const scheduledStart = new Date(appointment.appointmentDate);
    if (!Number.isNaN(slotHour) && !Number.isNaN(slotMinute)) {
        scheduledStart.setHours(slotHour, slotMinute, 0, 0);
    }
    if (scheduledStart.getTime() > Date.now()) {
        throw new AppError(STATUS.BAD_REQUEST, MESSAGES.APPOINTMENT.CANNOT_COMPLETE_BEFORE_TIME);
    }

    appointment.status = "COMPLETED";
    await appointment.save();

    // Log appointment completion
    const actor = await resolveActor(req.user);
    await recordAudit({
        actor,
        action: "APPOINTMENT_COMPLETED",
        targetType: "APPOINTMENT",
        targetId: appointment.appointmentId,
        message: MESSAGES.AUDIT.APPOINTMENT_COMPLETED(appointment.appointmentId)
    });

    return sendSuccess(res, STATUS.OK, MESSAGES.APPOINTMENT.COMPLETED, {
        appointment
    });
};
