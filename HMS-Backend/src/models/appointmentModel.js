const mongoose = require('mongoose');
const Counter = require('./counterModel');

const appointmentSchema = new mongoose.Schema({
    appointmentId: {
        type: String,
        unique: true,
        trim: true,
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient ID is required'],
    },
    doctorEmployeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, 'Doctor ID is required'],
    },
    date: {
        type: Date,
        required: [true, 'Appointment date is required'],
    },
    timeSlot: {
        type: String,
        required: [true, 'Time slot is required'],
        trim: true,
        match: [
            /^\d{2}:\d{2}-\d{2}:\d{2}$/,
            'Time slot must be in HH:MM-HH:MM format (e.g. 09:00-09:30)',
        ],
    },
    department: {
        type: String,
        enum: {
            values: ['OPD', 'IPD', 'Lab', 'Pharmacy', 'Admin'],
            message: 'Department must be OPD, IPD, Lab, Pharmacy, or Admin'
        },
        required: [true, 'Department is required']
    },
    appointmentType: {
        type: String,
        enum: {
            values: ['Consultation', 'Follow-up', 'Emergency', 'Check-up'],
            message: 'Invalid appointment type'
        },
        default: 'Consultation'
    },
    reasonForVisit: {
        type: String,
        required: [true, 'Reason for visit is required'],
        trim: true
    },
    consultationFee: {
        type: Number,
        required: [true, 'Consultation fee is required'],
        min: [0, 'Consultation fee cannot be negative']
    },
    status: {
        type: String,
        enum: {
            values: ['BOOKED', 'CANCELLED', 'COMPLETED'],
            message: 'Status must be BOOKED, CANCELLED, or COMPLETED',
        },
        default: 'BOOKED',
    },

    // Doctor's consultation details (filled after appointment)
    doctorNotes: {
        type: String,
        default: ''
    },
    diagnosis: {
        type: String,
        default: ''
    },
    prescription: {
        type: String,
        default: ''
    },

    // Metadata
    createdByEmployeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Created by is required'],
    },
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    cancellationReason: {
        type: String,
        default: ''
    },

    // Future integrations (prepared but not implemented)
    billId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bill',
        default: null
    },
    medicalRecordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MedicalRecord',
        default: null
    }
}, {
    timestamps: true
});

// Auto-generate appointmentId before saving
appointmentSchema.pre('save', async function (next) {
    try {
        if (!this.appointmentId) {
            const seq = await Counter.getNextSequence('appointmentId');
            this.appointmentId = `APT-${String(seq).padStart(4, '0')}`;
        }
    } catch (error) {
        throw error;
    }
});

// Index for faster queries
appointmentSchema.index({ date: 1, doctorEmployeeId: 1 });
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);