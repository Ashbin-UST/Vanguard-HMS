const mongoose = require("mongoose");
const { timeStamp } = require("node:console");

const medicalRecordSchema = new mongoose.Schema({
    medicalRecordId: {
        type: String,
        required: true,
        unique: true
    },
    appointmentId: {
        type: String,
        required: true,
        ref: "Appointments"
    },
    patientId: {
        type: String,
        required: true,
        ref: "Patients"
    },
    doctorEmployeeId: {
        type: String,
        required: true,
        ref: "Employees"
    },
    symptoms: {
        type: String,
        required: true
    },
    diagnosis: {
        type: String,
        required: true
    },
    prescriptionItems: [{
        name: {type: String, required: true},
        dosage: {type: String, required: true},
        duration: {type: String, required: true}
    }],
    notes: {
        type: String
    }
}, {timeStamps: { createdAt: "created_at" }}
);

// Pre-save hook to generate sequential ID
medicalRecordSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'medicalRecord' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.medicalRecordId = `MEDREC-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }
    next();
});

module.exports = mongoose.model("MedicalRecords", medicalRecordSchema);