const mongoose = require("mongoose");
const Counter = require("./Counter");

const patientSchema = new mongoose.Schema(
    {
        UHID: {
            type: String,
            unique: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        gender: {
            type: String,
            enum: ["Male", "Female"],
            required: true
        },

        dob: {
            type: Date,
            required: true
        },

        address: {
            houseName: {
                type: String,
                required: true
            },
            houseNumber: {
                type: String,
                required: true
            },
            city: {
                type: String,
                required: true
            },
            postCode: {
                type: String,
                required: true
            }
        },

        emergencyContact: {
            contactName: {
                type: String,
                required: true
            },
            relationship: {
                type: String,
                required: true
            },
            contactNumber: {
                type: String,
                required: true
            }
        },

        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE"
        },

        createdByEmployeeId: {
            type: String,
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

// Pre-save hook to generate sequential UHID
patientSchema.pre("save", async function () {
    if (this.isNew && !this.UHID) {
        const counter = await Counter.findOneAndUpdate(
            { name: "patients" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        this.UHID = `UHID-${String(counter.seq).padStart(6, "0")}`;
    }
});

module.exports = mongoose.model("Patients", patientSchema);