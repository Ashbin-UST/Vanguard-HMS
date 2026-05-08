const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({ 
    employeeCode: {
        type: String,
        unique: true,
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
        required: true,
        unique: true
    },
    department: {
        type: String,
        enum: ["OPD", "IPD", "Lab", "Pharmacy", "Admin"],
        required: true
    },
    designation: {
        type: String,
        enum: ["OWNER", "ADMIN", "DOCTOR", "RECEPTIONIST", "CASHIER", "NURSE", "LAB_TECH", "PHARMACIST"],
        required: true
    },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"],
        required: true
    },
    joiningDate: {
        type: Date,
        required: true
    },
    medicalRegistrationNumber: {
        type: String,
        unique: true
    },
    specialization: {
        type: String
    },
    qualification: [{
        type: String
    }],
    consultationFee: {
        type: String
    },
    availabilitySlots: [{
    day: {
        type: String,
        enum: [
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY",
            "SUNDAY"
        ],
        required: true
    },

    startTime: {
        type: String,
        required: true
    },

    endTime: {
        type: String,
        required: true
    }
}]
})

// Pre-save hook to generate sequential ID
employeeSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'employees' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.employeeCode = `EMP-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }
    next();
});

module.exports = mongoose.model("Employee", employeeSchema);