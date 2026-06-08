const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
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
        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE"
        },
        roles: [{
            type: String,
            enum: ["OWNER", "ADMIN", "STAFF"],
            required: true
        }],
        employeeCode: {
            type: String,
            required: true
        },
        lastLoginAt: {
            type: Date,
            default: null
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        verificationToken: {
            type: String
        },
        verificationTokenExpiry: {
            type: Date
        }
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    }
);

module.exports = mongoose.model("User", userSchema);