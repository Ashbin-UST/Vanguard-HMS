const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    paymentId: { type: String, unique: true },
    billId: {
        type: mongoose.Types.ObjectId,
        ref: "Bill"
    },
    amount: {
        type: mongoose.Types.ObjectId,
        ref: "Bill"
    },
    method: {
        type: String,
        enum: ["Cash", "Card", "UPI"],
        required: true
    },
    paidAt: {},
    receivedByEmployeeId: {
        type: mongoose.Types.ObjectId,
        ref: "Employee"
    }
}, {
    timestamps: {
        createdAt: "created_at",
    }
});
 
 
module.exports = mongoose.model('Payment', paymentSchema);