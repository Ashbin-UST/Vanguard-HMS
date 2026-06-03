const mongoose = require("mongoose");

const patientUserSchema = new mongoose.Schema(
    {
        email: {
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

        patientUHID: {
            type: String,
            required: true,
            unique: true
        },

        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE"
        },

        resetPasswordTokenHash: {
            type: String,
            default: null
        },

        resetPasswordTokenExpiry: {
            type: Date,
            default: null
        },

        lastLoginAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    }
);

module.exports = mongoose.model("PatientUser", patientUserSchema);