const monggose = require('mongoose');
const Counter = require('./counterModel');

const billModelSchema = new mongoose.Schema({
    billId: {
        type: String,
        unique: true,
        trim: true,
        required: [true, "Bill Id is requierd"],
    },

    patientId: {
        type: String,
        ref: 'Patient',
        required: true,
        trim: true,
    },

    appointmentId: {
        type: String,
        ref: 'Appointment',
        trim: true,
        default: null,
    },

    items: {
        serviceName: { type: String, trim: true },
        amount: { type: Number },
    },

    total: {
        type: Number,
        required: true,
    },

    status: {
        type: String,
        enum: ['pending', 'partial', 'paid'],
        required: true,
    },

    createdByEmployeeId: {
        type: String,
        ref: 'Employee',
        required: true,
    },

},
    { timestamps: true },
);

billModelSchema.pre('save', async function () {
    if (!this.billId) {
        const seq = await Counter.getNextSequence('billId');
        this.billId = `BILL-${String(seq).padStart(4, '0')}`;
    }
});

module.exports = mongoose.Model('Bill', billModelSchema);