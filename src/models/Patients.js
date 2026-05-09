const mongoose = require("mongoose");
const Counter = require("./Counter");

const patientSchema = new mongoose.Schema({
    UHID: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ["Male", "Female"],
        required: true
    },
    dob: {
        type: Date,
        required: true
    },
    address: {
        houseName: {type: String},
        houseNumber: {type: String},
        city: {type: String, required: true},
        postCode: {type: String, required: true}
    },
    emergencyContact: {
        type: String
    },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"]
    }
});

// Pre-save hook to generate sequential ID
patientSchema.pre('save', async function (next) {
    if (this.isNew) {
            const counter = await Counter.findOneAndUpdate(
                { name: 'patients' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.UHID = `UHID-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
    }
});

module.exports = mongoose.model("Patients", patientSchema);