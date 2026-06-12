const Appointment = require("../models/Appointments");
const recordAudit = require("./recordAudit");
const MESSAGES = require("../constants/messages");

const SYSTEM_ACTOR = { employeeCode: "SYSTEM", name: "System", designation: "SYSTEM" };

// Skip repeat sweeps from hot read paths within the same warm instance
const SWEEP_MIN_INTERVAL_MS = 60 * 1000;
let lastSweepAt = 0;

// True when the appointment's scheduled end (date + slot end) has passed
const endTimePassed = (appointment) => {
    const slotEnd = (appointment.timeSlot || "").split("-")[1] || "";
    const [slotHour, slotMinute] = slotEnd.split(":").map(Number);
    if (Number.isNaN(slotHour) || Number.isNaN(slotMinute)) return false;

    const scheduledEnd = new Date(appointment.appointmentDate);
    scheduledEnd.setHours(slotHour, slotMinute, 0, 0);
    return scheduledEnd.getTime() <= Date.now();
};

// Marks BOOKED appointments whose end time has passed as COMPLETED; never throws
const autoCompleteDueAppointments = async () => {

    if (Date.now() - lastSweepAt < SWEEP_MIN_INTERVAL_MS) return;
    lastSweepAt = Date.now();

    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);

        const [pastDue, todays] = await Promise.all([
            Appointment.find({ status: "BOOKED", appointmentDate: { $lt: todayStart } }),
            Appointment.find({ status: "BOOKED", appointmentDate: { $gte: todayStart, $lt: tomorrowStart } })
        ]);

        const due = [...pastDue, ...todays.filter(endTimePassed)];

        if (!due.length) return;

        // Re-check BOOKED in the filter so a concurrent cancel is never overwritten
        await Appointment.updateMany(
            { _id: { $in: due.map((a) => a._id) }, status: "BOOKED" },
            { status: "COMPLETED" }
        );

        for (const appointment of due) {
            await recordAudit({
                actor: SYSTEM_ACTOR,
                action: "APPOINTMENT_COMPLETED",
                targetType: "APPOINTMENT",
                targetId: appointment.appointmentId,
                message: MESSAGES.AUDIT.APPOINTMENT_AUTO_COMPLETED(appointment.appointmentId)
            });
        }
    } catch (err) {
        console.error("Auto-complete sweep failed:", err);
    }
};

module.exports = autoCompleteDueAppointments;
