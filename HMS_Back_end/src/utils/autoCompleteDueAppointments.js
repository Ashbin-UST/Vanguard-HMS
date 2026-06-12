const Appointment = require("../models/Appointments");
const recordAudit = require("./recordAudit");
const slotInstantMs = require("./slotInstantMs");
const { istDayStart } = require("./slotInstantMs");
const MESSAGES = require("../constants/messages");

const SYSTEM_ACTOR = { employeeCode: "SYSTEM", name: "System", designation: "SYSTEM" };

// Skip repeat sweeps from hot read paths within the same warm instance
const SWEEP_MIN_INTERVAL_MS = 60 * 1000;
let lastSweepAt = 0;

// True when the appointment's scheduled end (date + slot end) has passed (hospital time)
const endTimePassed = (appointment) => {
    const slotEnd = (appointment.timeSlot || "").split("-")[1];
    const endMs = slotInstantMs(appointment.appointmentDate, slotEnd);
    return !Number.isNaN(endMs) && endMs <= Date.now();
};

// Marks BOOKED appointments whose end time has passed as COMPLETED; never throws
const autoCompleteDueAppointments = async () => {

    if (Date.now() - lastSweepAt < SWEEP_MIN_INTERVAL_MS) return;
    lastSweepAt = Date.now();

    try {
        // IST calendar-day boundaries so bucketing is independent of the host timezone
        const todayStart = istDayStart();
        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

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
