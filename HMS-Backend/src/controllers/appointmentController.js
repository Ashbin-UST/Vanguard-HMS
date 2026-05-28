const Appointment = require("../models/appointmentModel");
const Patient = require("../models/patientModel");
const Employee = require("../models/employeeModel");
const User = require("../models/userModel");
const { generateBookableSlots } = require("../utils/slotGenerator");
const {
    sendAppointmentConfirmationEmail,
    sendAppointmentCancellationEmail,
} = require("../utils/appointmentEmailService");

/**
 * Helper: Check if time slots overlap
 */
const doTimeSlotsOverlap = (slot1, slot2) => {
    const [start1, end1] = slot1.split("-");
    const [start2, end2] = slot2.split("-");

    // Convert to minutes for easy comparison
    const toMinutes = (time) => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
    };

    const slot1Start = toMinutes(start1);
    const slot1End = toMinutes(end1);
    const slot2Start = toMinutes(start2);
    const slot2End = toMinutes(end2);

    // Slots overlap if one starts before the other ends
    return slot1Start < slot2End && slot2Start < slot1End;
};

/**
 * Helper: Validate appointment date
 */
const validateAppointmentDate = (date) => {
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
        throw new Error("Cannot book appointment in the past");
    }

    return appointmentDate;
};

/**
 * Create new appointment
 * Access: RECEPTIONIST, ADMIN, OWNER
 */
exports.createAppointment = async (req, res) => {
    try {
        const {
            patientId,
            doctorEmployeeId,
            date,
            timeSlot,
            department,
            appointmentType,
            reasonForVisit,
            consultationFee,
        } = req.body;

        // Validate required fields
        if (
            !patientId ||
            !doctorEmployeeId ||
            !date ||
            !timeSlot ||
            !reasonForVisit
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Patient, doctor, date, time slot, and reason for visit are required",
            });
        }

        // Validate time slot format
        const timeSlotRegex = /^\d{2}:\d{2}-\d{2}:\d{2}$/;
        if (!timeSlotRegex.test(timeSlot)) {
            return res.status(400).json({
                success: false,
                message: "Time slot must be in HH:MM-HH:MM format (e.g., 09:00-09:30)",
            });
        }

        // Validate appointment date (not in past)
        const appointmentDate = validateAppointmentDate(date);

        // Check if patient exists
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found",
            });
        }

        if (patient.status === "INACTIVE") {
            return res.status(400).json({
                success: false,
                message: "Cannot book appointment for inactive patient",
            });
        }

        // Check if doctor exists and is active
        const doctor = await Employee.findById(doctorEmployeeId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }

        if (doctor.status === "INACTIVE") {
            return res.status(400).json({
                success: false,
                message: "Doctor is currently inactive",
            });
        }

        // Verify doctor has DOCTOR role
        const doctorUser = await User.findOne({ employeeId: doctor._id });
        if (!doctorUser || !doctorUser.roles.includes("DOCTOR")) {
            return res.status(400).json({
                success: false,
                message: "Selected employee is not a doctor",
            });
        }

        // Check if time slot is in doctor's availability
        if (!doctor.availabilitySlots || doctor.availabilitySlots.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Doctor has no availability slots configured",
            });
        }

        const isSlotAvailable = doctor.availabilitySlots.some((slot) =>
            doTimeSlotsOverlap(slot, timeSlot),
        );

        if (!isSlotAvailable) {
            return res.status(400).json({
                success: false,
                message: `Doctor is not available at ${timeSlot}. Available slots: ${doctor.availabilitySlots.join(", ")}`,
            });
        }

        // CRITICAL: Check for double booking
        const existingAppointment = await Appointment.findOne({
            doctorEmployeeId: doctor._id,
            date: appointmentDate,
            status: { $in: ["BOOKED", "COMPLETED"] }, // Ignore cancelled
        });

        if (existingAppointment) {
            // Check if time slots overlap
            const hasConflict = doTimeSlotsOverlap(
                existingAppointment.timeSlot,
                timeSlot,
            );

            if (hasConflict) {
                return res.status(409).json({
                    success: false,
                    message: `Doctor already has an appointment at ${existingAppointment.timeSlot} on this date`,
                });
            }
        }

        // Determine consultation fee
        const fee =
            consultationFee !== undefined
                ? consultationFee
                : doctor.consultationFee || 0;

        // Create appointment
        const appointment = await new Appointment({
            patientId: patient._id,
            doctorEmployeeId: doctor._id,
            date: appointmentDate,
            timeSlot,
            department: department || doctor.department,
            appointmentType: appointmentType || "Consultation",
            reasonForVisit,
            consultationFee: fee,
            status: "BOOKED",
            createdByEmployeeId: req.user.id,
        }).save();

        // Populate appointment details
        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate("patientId", "UHID name phone email gender age")
            .populate(
                "doctorEmployeeId",
                "employeeCode name specialization department consultationFee",
            )
            .populate("createdByEmployeeId", "email userId");

        // Send confirmation email to patient
        try {
            await sendAppointmentConfirmationEmail({
                patientEmail: patient.email,
                patientName: patient.name,
                doctorName: doctor.name,
                date: appointmentDate,
                timeSlot,
                department: appointment.department,
                consultationFee: fee,
                appointmentId: appointment.appointmentId,
            });
        } catch (emailError) {
            console.error("Failed to send confirmation email:", emailError);
            // Don't fail the appointment creation if email fails
        }

        return res.status(201).json({
            success: true,
            message: "Appointment booked successfully",
            data: populatedAppointment,
        });
    } catch (error) {
        console.log("Create appointment error:", error);

        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res
                .status(400)
                .json({ success: false, message: messages.join(", ") });
        }

        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get all appointments (with filters)
 * Access: RECEPTIONIST, ADMIN, OWNER
 */
exports.getAllAppointments = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            date,
            doctorId,
            patientId,
            department,
        } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (doctorId) filter.doctorEmployeeId = doctorId;
        if (patientId) filter.patientId = patientId;
        if (department) filter.department = department;

        // Date filter
        if (date) {
            const searchDate = new Date(date);
            const nextDay = new Date(searchDate);
            nextDay.setDate(nextDay.getDate() + 1);

            filter.date = {
                $gte: searchDate,
                $lt: nextDay,
            };
        }

        // ADD this right before const appointments = await Appointment.find(filter):
        if (!["ADMIN", "OWNER"].some((r) => req.user.roles.includes(r))) {
            filter.createdByEmployeeId = req.user.id;
        }

        const appointments = await Appointment.find(filter)
            .populate("patientId", "UHID name phone email gender age")
            .populate(
                "doctorEmployeeId",
                "employeeCode name specialization department",
            )
            .populate("createdByEmployeeId", "email userId")
            .sort({ date: -1, timeSlot: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Appointment.countDocuments(filter);

        return res.status(200).json({
            success: true,
            message: "Appointments retrieved successfully",
            data: appointments,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit),
            },
        });
    } catch (error) {
        console.log("Get all appointments error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get doctor's appointments (for logged-in doctor)
 * Access: DOCTOR (own appointments only)
 */
exports.getMyAppointments = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, date } = req.query;

        // Get doctor's employee record
        const user = await User.findById(req.user.id);
        if (!user || !user.employeeId) {
            return res.status(404).json({
                success: false,
                message: "Employee record not found",
            });
        }

        const filter = {
            doctorEmployeeId: user.employeeId,
        };

        if (status) filter.status = status;

        if (date) {
            const searchDate = new Date(date);
            const nextDay = new Date(searchDate);
            nextDay.setDate(nextDay.getDate() + 1);

            filter.date = {
                $gte: searchDate,
                $lt: nextDay,
            };
        }

        const appointments = await Appointment.find(filter)
            .populate("patientId", "UHID name phone email gender age medicalHistory")
            .populate(
                "doctorEmployeeId",
                "employeeCode name specialization department",
            )
            .populate("createdByEmployeeId", "email userId")
            .sort({ date: 1, timeSlot: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Appointment.countDocuments(filter);

        return res.status(200).json({
            success: true,
            message: "Your appointments retrieved successfully",
            data: appointments,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit),
            },
        });
    } catch (error) {
        console.log("Get my appointments error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get appointments for specific doctor
 * Access: ADMIN, NURSE, OWNER
 */
exports.getDoctorAppointments = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { page = 1, limit = 10, status, date } = req.query;

        // Verify doctor exists
        const doctor = await Employee.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }

        const filter = {
            doctorEmployeeId: doctorId,
        };

        if (status) filter.status = status;

        if (date) {
            const searchDate = new Date(date);
            const nextDay = new Date(searchDate);
            nextDay.setDate(nextDay.getDate() + 1);

            filter.date = {
                $gte: searchDate,
                $lt: nextDay,
            };
        }

        const appointments = await Appointment.find(filter)
            .populate("patientId", "UHID name phone email gender age")
            .populate(
                "doctorEmployeeId",
                "employeeCode name specialization department",
            )
            .populate("createdByEmployeeId", "email userId")
            .sort({ date: 1, timeSlot: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Appointment.countDocuments(filter);

        return res.status(200).json({
            success: true,
            message: `Appointments for Dr. ${doctor.name} retrieved successfully`,
            data: appointments,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit),
            },
        });
    } catch (error) {
        console.log("Get doctor appointments error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get appointments for specific patient
 * Access: RECEPTIONIST, ADMIN, OWNER
 */
exports.getPatientAppointments = async (req, res) => {
    try {
        const { patientId } = req.params;

        // Verify patient exists
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found",
            });
        }

        const filter = { patientId };
        if (!["ADMIN", "OWNER"].some((r) => req.user.roles.includes(r))) {
            filter.createdByEmployeeId = req.user.id;
        }
        const appointments = await Appointment.find(filter)
            .populate(
                "doctorEmployeeId",
                "employeeCode name specialization department consultationFee",
            )
            .populate("createdByEmployeeId", "email userId")
            .sort({ date: -1, timeSlot: -1 });

        return res.status(200).json({
            success: true,
            message: `Appointments for ${patient.name} retrieved successfully`,
            data: appointments,
        });
    } catch (error) {
        console.log("Get patient appointments error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get today's appointments
 * Access: RECEPTIONIST, ADMIN, OWNER
 */
exports.getTodayAppointments = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const filter = { date: { $gte: today, $lt: tomorrow } };
        if (!["ADMIN", "OWNER"].some((r) => req.user.roles.includes(r))) {
            filter.createdByEmployeeId = req.user.id;
        }
        const appointments = await Appointment.find(filter)
            .populate("patientId", "UHID name phone gender age")
            .populate(
                "doctorEmployeeId",
                "employeeCode name specialization department",
            )
            .sort({ timeSlot: 1 });

        return res.status(200).json({
            success: true,
            message: `Found ${appointments.length} appointment(s) for today`,
            data: appointments,
        });
    } catch (error) {
        console.log("Get today appointments error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get appointment by ID
 * Access: All authenticated users
 */
exports.getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const filter = { _id: id };
        if (!["ADMIN", "OWNER"].some((r) => req.user.roles.includes(r))) {
            filter.createdByEmployeeId = req.user.id;
        }
        const appointment = await Appointment.findOne(filter)
            .populate(
                "patientId",
                "UHID name phone email gender age dob address medicalHistory",
            )
            .populate(
                "doctorEmployeeId",
                "employeeCode name specialization department consultationFee qualification",
            )
            .populate("createdByEmployeeId", "email userId")
            .populate("cancelledBy", "email userId");

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Appointment retrieved successfully",
            data: appointment,
        });
    } catch (error) {
        console.log("Get appointment by ID error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Update appointment status
 * Access: RECEPTIONIST, DOCTOR, ADMIN, OWNER
 */
exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required",
            });
        }

        const validStatuses = ["BOOKED", "CANCELLED", "COMPLETED"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${validStatuses.join(", ")}`,
            });
        }

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
        }

        // Validate status transitions
        if (appointment.status === "COMPLETED" && status !== "COMPLETED") {
            return res.status(400).json({
                success: false,
                message: "Cannot change status of completed appointment",
            });
        }

        if (appointment.status === "CANCELLED" && status === "BOOKED") {
            return res.status(400).json({
                success: false,
                message:
                    "Cannot reactivate cancelled appointment. Create a new one instead",
            });
        }

        appointment.status = status;
        await appointment.save();

        const updatedAppointment = await Appointment.findById(id)
            .populate("patientId", "UHID name phone email")
            .populate(
                "doctorEmployeeId",
                "employeeCode name specialization department",
            );

        return res.status(200).json({
            success: true,
            message: `Appointment status updated to ${status}`,
            data: updatedAppointment,
        });
    } catch (error) {
        console.log("Update appointment status error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Add doctor notes to appointment
 * Access: DOCTOR (own appointments), ADMIN, OWNER
 */
exports.addDoctorNotes = async (req, res) => {
    try {
        const { id } = req.params;
        const { doctorNotes, diagnosis, prescription } = req.body;

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
        }

        // If user is DOCTOR, verify it's their appointment
        const user = await User.findById(req.user.id);
        if (
            user.roles.includes("DOCTOR") &&
            !user.roles.includes("ADMIN") &&
            !user.roles.includes("OWNER")
        ) {
            if (
                appointment.doctorEmployeeId.toString() !== user.employeeId.toString()
            ) {
                return res.status(403).json({
                    success: false,
                    message: "You can only add notes to your own appointments",
                });
            }
        }

        // Update notes
        if (doctorNotes !== undefined) appointment.doctorNotes = doctorNotes;
        if (diagnosis !== undefined) appointment.diagnosis = diagnosis;
        if (prescription !== undefined) appointment.prescription = prescription;

        await appointment.save();

        const updatedAppointment = await Appointment.findById(id)
            .populate("patientId", "UHID name phone email")
            .populate("doctorEmployeeId", "employeeCode name specialization");

        return res.status(200).json({
            success: true,
            message: "Doctor notes added successfully",
            data: updatedAppointment,
        });
    } catch (error) {
        console.log("Add doctor notes error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Cancel appointment
 * Access: RECEPTIONIST, ADMIN, OWNER
 */
exports.cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { cancellationReason } = req.body;

        const appointment = await Appointment.findById(id)
            .populate("patientId", "UHID name email")
            .populate("doctorEmployeeId", "name");

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
        }

        if (appointment.status === "CANCELLED") {
            return res.status(400).json({
                success: false,
                message: "Appointment is already cancelled",
            });
        }

        if (appointment.status === "COMPLETED") {
            return res.status(400).json({
                success: false,
                message: "Cannot cancel completed appointment",
            });
        }

        appointment.status = "CANCELLED";
        appointment.cancelledBy = req.user.id;
        appointment.cancellationReason = cancellationReason || "No reason provided";
        await appointment.save();

        // Send cancellation email
        try {
            await sendAppointmentCancellationEmail({
                patientEmail: appointment.patientId.email,
                patientName: appointment.patientId.name,
                doctorName: appointment.doctorEmployeeId.name,
                date: appointment.date,
                timeSlot: appointment.timeSlot,
                reason: appointment.cancellationReason,
                appointmentId: appointment.appointmentId,
            });
        } catch (emailError) {
            console.error("Failed to send cancellation email:", emailError);
        }

        return res.status(200).json({
            success: true,
            message: "Appointment cancelled successfully",
            data: appointment,
        });
    } catch (error) {
        console.log("Cancel appointment error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete appointment
 * Access: ADMIN, OWNER only
 */
exports.deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findByIdAndDelete(id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Appointment deleted successfully",
        });
    } catch (error) {
        console.log("Delete appointment error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get available time slots for a doctor on a specific date
 * Access: RECEPTIONIST, ADMIN, OWNER
 */
exports.getAvailableSlots = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { date, duration } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Date is required",
            });
        }

        const slotDuration = parseInt(duration, 10) || 30;

        if (![15, 30].includes(slotDuration)) {
            return res.status(400).json({
                success: false,
                message: "Duration must be 15 or 30 minutes",
            });
        }

        const doctor = await Employee.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found",
            });
        }

        if (!doctor.availabilitySlots || doctor.availabilitySlots.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Doctor has no availability slots configured",
                data: {
                    doctorName: doctor.name,
                    date: new Date(date),
                    availableSlots: [],
                    bookedSlots: [],
                    totalSlots: 0,
                    slotDuration,
                },
            });
        }

        const searchDate = new Date(date);
        const nextDay = new Date(searchDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const bookedAppointments = await Appointment.find({
            doctorEmployeeId: doctorId,
            date: { $gte: searchDate, $lt: nextDay },
            status: { $in: ["BOOKED", "COMPLETED"] },
        }).select("timeSlot");

        const bookedSlots = bookedAppointments.map((apt) => apt.timeSlot);

        const { available, allGenerated, mergedRanges } = generateBookableSlots(
            doctor.availabilitySlots,
            bookedSlots,
            slotDuration,
        );

        return res.status(200).json({
            success: true,
            message: `${available.length} slot(s) available (${slotDuration}-min intervals)`,
            data: {
                doctorName: doctor.name,
                date: searchDate,
                slotDuration,
                mergedRanges,
                allSlots: allGenerated,
                availableSlots: available,
                bookedSlots,
                totalAvailable: available.length,
            },
        });
    } catch (error) {
        console.log("Get available slots error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get available doctors (optionally filter by specialization/department)
 * Access: RECEPTIONIST, ADMIN, OWNER
 */
exports.getAvailableDoctors = async (req, res) => {
    try {
        const { specialization, department } = req.query;

        const filter = { status: "ACTIVE" };
        if (specialization)
            filter.specialization = { $regex: specialization, $options: "i" };
        if (department) filter.department = department;

        // Get all doctors (employees with DOCTOR role)
        const doctors = await Employee.find(filter).select(
            "employeeCode name specialization department consultationFee availabilitySlots qualification",
        );

        // Filter only those with DOCTOR role
        const doctorIds = doctors.map((d) => d._id);
        const doctorUsers = await User.find({
            employeeId: { $in: doctorIds },
            roles: "DOCTOR",
            status: "ACTIVE",
            approvalStatus: "APPROVED",
        }).select("employeeId");

        const validDoctorIds = doctorUsers.map((u) => u.employeeId.toString());
        const availableDoctors = doctors.filter((d) =>
            validDoctorIds.includes(d._id.toString()),
        );

        return res.status(200).json({
            success: true,
            message: `Found ${availableDoctors.length} available doctor(s)`,
            data: availableDoctors,
        });
    } catch (error) {
        console.log("Get available doctors error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};