const mongoose = require('mongoos');
const Counter = require('./counterModel'); // import counter model

const paymentSchema = new mongoose.Schema({
    paymentId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },

    billId: {
        type: String,
        ref: 'Bill',
        required: true,
        trim: true,
        unique: true,
    },

    amount: {
        type: Number,
        required: true,
    },

    method: {
        type: String,
        enum: ['cash', 'card', 'UPI'],
    },

    paidAt: {
        type: Date,
        value: Date.now,
    },

    receivedByEmployeeId: {
        type: String,
        ref: 'Employee',
        required: true,
        trim: true,
    }

});

paymentSchema.pre('save', async function () {
    if (!this.paymentId) {
        const seq = await Counter.getNextSequence('paymentId');
        this.paymentId = `PMT-${String(seq).padStart(4, '0')}`;
    }
});