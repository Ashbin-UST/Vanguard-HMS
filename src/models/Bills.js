const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
    billId: {
        type: String,
        required: true,
        unique: true
    },
    patientId: {
        type: String,
        required: true,
        ref: "Patients"
    },
    appointmentId: {
        type: String,
        ref: "Appoinments"
    },
    items: [{
        serviceName: {type: String, required: true},
        amount: {type: Number, required: true}
    }],
    total: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["PENDING", "PAID", "PARTIAL"],
        default: "PENDING"
    },
    createdByEmployeeId: {
        type: String,
        required: true,
        ref: "Employees"
    }
});

// Pre-save hook to generate sequential ID
billSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'bill' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.billId = `B-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }
    next();
});

module.exports = mongoose.model("Bills", billSchema);