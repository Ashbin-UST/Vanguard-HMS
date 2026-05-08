const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
    appointmentId: {
        type: String,
        required: true,
        unique: true
    },
    patientId: {
        type: String,
        required: true,
        ref: "Appointments"
    },
    doctorEmployeeId: {
        type: String,
        required: true,
        ref: "Employee"
    },
    date: {
        type: Date,
        required: true
    },
    timeSlot: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["BOOKED", "CANCELED", "COMPLETED"],
        default: "BOOKED"
    },
    createdByEmployeeId: {
        type: String,
        required: true,
        ref: "Employees"
    }
});

// Pre-save hook to generate sequential ID
appointmentSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'appointments' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.appointmentId = `APT-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }
    next();
});

module.exports = mongoose.model("Appointments", appointmentSchema);