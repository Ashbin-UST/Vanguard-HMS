const mongoose = require("mongoose");
const Counter = require("./Counter");

const medicalRecordSchema = new mongoose.Schema({
    medicalRecordId: {
        type: String,
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

// Pre-save hook to generate sequential medical record id
medicalRecordSchema.pre('save', async function () {
    if (this.isNew) {
            const counter = await Counter.findOneAndUpdate(
                { name: 'medicalRecord' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.medicalRecordId = `MEDREC-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
    }
});

module.exports = mongoose.model("MedicalRecords", medicalRecordSchema);