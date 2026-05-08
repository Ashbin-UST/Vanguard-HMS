const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        userName: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        passwordHash: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            required: true
        },
        roles: [{
            type: String,
            enum: ["OWNER", "ADMIN", "DOCTOR", "RECEPTIONIST", 
                "CASHIER", "NURSE", "LAB_TECH", "PHARMACIST"],
            required: true
        }],
        employeeId: {
            type: String,
            required: true,
            ref: "Employees"
        },
        lastLoginAt: {
            type: Date,
            default: null
        }
    },
    {timestamps: {
        createdAt: 'created_at', updatedAt: 'updated_at'
    }}
);

module.exports = mongoose.model("User", userSchema);