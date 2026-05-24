const mongoose = require('mongoose');
const Counter = require('./counterModel');

const patientSchema = new mongoose.Schema({
    UHID: {
        type: String,
        trim: true,
        unique: true,
    },
    name: {
        type: String,
        trim: true,
        required: [true, 'Patient name is required'],
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        // unique: true,  ← REMOVED to allow family members
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    gender: {
        type: String,
        enum: {
            values: ['Male', 'Female', 'Other'],
            message: 'Gender must be Male, Female, or Other'
        },
        required: [true, 'Gender is required'],
    },
    dob: {
        type: Date,
        required: [true, 'Date of birth is required'],
    },
    address: {
        line1: { type: String },
        city: { type: String },
        postcode: { type: String }
    },
    emergencyContact: {
        name: { type: String },
        phone: { type: String },
        relation: { type: String }
    },
    medicalHistory: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: {
            values: ['ACTIVE', 'INACTIVE'],
            message: 'Status must be ACTIVE or INACTIVE'
        },
        default: 'ACTIVE',
    },
    registeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Auto-generate UHID before saving
patientSchema.pre('save', async function (next) {
    try {
        if (!this.UHID) {
            const seq = await Counter.getNextSequence('UHID');
            this.UHID = `UHID-${String(seq).padStart(4, '0')}`;
        }
    } catch (error) {
        throw error;
    }
});

// Virtual to calculate age from DOB
patientSchema.virtual('age').get(function () {
    if (!this.dob) return null;
    const today = new Date();
    const birthDate = new Date(this.dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
});

// Ensure virtuals are included in JSON
patientSchema.set('toJSON', { virtuals: true });
patientSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Patient', patientSchema);