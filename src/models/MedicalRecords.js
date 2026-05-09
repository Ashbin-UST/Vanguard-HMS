const mongoose = require("mongoose");
 
const medicalrecordSchema = new mongoose.Schema({
    medicalRecordId: { type: String, unique: true },
    appointmentId: {
        type: String,
        ref: "Appointment",
        required: true
    },
    doctorId: {
        type: String,
        ref: "Employee",
        required: true
    },
    symptoms: { type: String, required: true },
    diagnosis: { type: String, required: true },
    prescriptionNotes: [
        {
            name: String,
            dosage: String,
            duration: String
        }
    ],
 
}, {
    timestamps: {
        createdAt: "created_at",
    }
});
 
medicalrecordSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'MedicalRecords' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.medicalRecordId = `MR-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }
    next();
});
 
module.exports = mongoose.model('MedicalRecords', medicalrecordSchema);
 