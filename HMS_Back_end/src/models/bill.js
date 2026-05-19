const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
    billId: { type: String, unique: true },
    patientId: {
        type: mongoose.Types.ObjectId,
        ref: "Patient",
        required: true
    },
    appointmentId: {
        type: mongoose.Types.ObjectId,
        ref: "Appointment",
        required: true
    },
    items: [
        {
            serviceName: String,
            amount: Number
        }
    ],
    total: { type: Number },
    status: {
        type: String,
        enum: ["Pending", "Paid", "Partial"],
        required: true
    },
    createdByEmployeedId: {
        type: mongoose.Types.ObjectId,
        ref: "Employee"
    }
}, {
    timestamps: {
        createdAt: "created_at",
    }
});

    billSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'bill' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.billId = `BILL-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }
    next();
});

module.exports = mongoose.model('bill', billSchema);