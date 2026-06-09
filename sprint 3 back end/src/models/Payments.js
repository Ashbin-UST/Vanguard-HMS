const mongoose = require("mongoose");
const Counter = require("./Counter");

const paymentSchema = new mongoose.Schema({
    paymentId: {
        type: String,
        unique: true
    },
    billId: {
        type: String,
        required: true,
        ref: "Bills"
    },
    amount: {
        type: Number,
        required: true,
    },
    method: {
        type: String,
        enum: ["CASH", "CARD", "UPI"],
        required: true
    },
    paidAt: {
        type: Date,
        default: Date.now
    },
    receivedByEmployeeId: {
        type: String,
        required: true,
        ref: "Employees"
    }
});

// Pre-save hook to generate sequential payment id
paymentSchema.pre('save', async function () {
    if (this.isNew) {
            const counter = await Counter.findOneAndUpdate(
                { name: 'payment' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.paymentId = `PAY-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
    }
});

module.exports = mongoose.model("Payments", paymentSchema);