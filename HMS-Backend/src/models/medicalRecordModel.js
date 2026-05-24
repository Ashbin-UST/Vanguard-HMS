const mongoose = require('mongoose');
const Counter = require('./counterModel'); // import counter model

const prescriptionItemSchema = new mongoose.Schema(
    {
        medicineName: {
            type: String,
            required: true,
            trim: true
        },

        dosage: {
            type: String,
            required: true,
            trim: true
        },

        duration: {
            type: String,
            required: true,
            trim: true
        },
    },
);

const medicalRecordSchema = new mongoose.Schema({
    medicalRecordId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    appointmentId: {
        type: String,
        ref: 'Appointment',
        required: ['true', "Appointment Id is required"],
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient Id is required'],
    },
    doctorEmployeeId: {
        type: String,
        ref: 'Doctor',
        required: [true, 'Doctor Employee Id is required'],
    },
    symptoms: {
        type: String,
        trim: true,
        required: ['true', "Symptoms record is required"],
    },
    diagnosis: {
        type: String,
        trim: true,
        required: ['true', "Diagnosis record is required"],
    },
    prescriptionItems: [prescriptionItemSchema],

    notes: {
        type: String,
        trim: true,
    },
},
    { timestamps: true },
);

medicalRecordSchema.pre('save', async function () {
    if (!this.medicalRecordId) {
        const seq = await Counter.getNextSequence('medicalRecordId');
        this.medicalRecordId = `MED-${String(seq).padStart(4, '0')}`;
    }
});

module.exports = mongoose.Model('MedicalRecord', medicalRecordSchema);