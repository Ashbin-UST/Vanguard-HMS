const Appointment = require("../models/Appointments");

// BOOKED first, CANCELED last; within a status nearest date and time slot on top
const STATUS_PRIORITY = ["BOOKED", "COMPLETED", "CANCELED"];

const listAppointments = (filter, skip, limit) =>
    Appointment.aggregate([
        { $match: filter },
        { $addFields: { statusRank: { $indexOfArray: [STATUS_PRIORITY, "$status"] } } },
        { $sort: { statusRank: 1, appointmentDate: 1, timeSlot: 1, _id: 1 } },
        { $skip: skip },
        { $limit: limit },
        { $project: { __v: 0, statusRank: 0 } }
    ]);

module.exports = listAppointments;
