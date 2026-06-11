const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const Patient = require("../models/Patients");
const sendEmail = require("../utils/sendEmail");
const emailTemplates = require("../utils/emailTemplates");
const { toSafePatient } = require("../utils/toSafePatient");
require("dotenv").config();

const SALT_ROUNDS = 12;

// Reset codes are typed by hand in the mobile app and matched case-sensitively,
// so the alphabet skips easily-confused characters (0/O, 1/I/l, etc.) but mixes
// upper/lowercase letters, digits, and special characters. 8 chars from a
// 65-char alphabet (~48 bits) keeps blind guessing infeasible within the
// 15-minute expiry.
const RESET_CODE_ALPHABET =
    "ABCDEFGHJKMNPQRSTUVWXYZ" +
    "abcdefghjkmnpqrstuvwxyz" +
    "23456789" +
    "!@#$%&*+-=?";
const RESET_CODE_LENGTH = 8;

const generateResetCode = () =>
    Array.from(
        { length: RESET_CODE_LENGTH },
        () => RESET_CODE_ALPHABET[crypto.randomInt(RESET_CODE_ALPHABET.length)]
    ).join("");

// Sign a patient JWT. The `type: "PATIENT"` marker keeps these tokens from
// being accepted on employee routes (and vice-versa).
const signPatientToken = (patient) =>
    jwt.sign(
        {
            patientId: patient.UHID,
            type: "PATIENT"
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    );

// Self-service patient registration. The patient sets their own password and
// the account is immediately ACTIVE (no staff approval, no temporary password).
exports.register = async (req, res) => {

    try {
        const {
            name,
            phone,
            email,
            password,
            gender,
            dob,
            address,
            emergencyContact
        } = req.body;

        const existingPatient = await Patient.findOne({ email });

        if (existingPatient) {
            return res.status(409).json({
                message: "Patient with this email is already registered"
            });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const patient = new Patient({
            name,
            phone,
            email,
            passwordHash,
            gender,
            dob,
            address,
            emergencyContact,
            status: "ACTIVE",
            mustChangePassword: false
        });

        await patient.save();

        return res.status(201).json({
            message: "Registration successful. You can now log in.",
            patient: toSafePatient(patient)
        });
    }
    catch (err) {
        console.error("Error during patient registration: ", err);
        return res.status(500).json({
            message: "Server error during patient registration"
        });
    }
};

// Authenticate a patient by email + password and return a JWT
exports.login = async (req, res) => {

    try {
        const { email, password } = req.body;

        const patient = await Patient.findOne({ email });
        if (!patient) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isMatch = Boolean(await bcrypt.compare(password, patient.passwordHash));
        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        if (patient.status !== "ACTIVE") {
            return res.status(403).json({
                message: "Account is inactive"
            });
        }

        const token = signPatientToken(patient);

        return res.status(200).json({
            message: "Login successful",
            token,
            patient: toSafePatient(patient)
        });
    }
    catch (err) {
        console.error("Patient login error:", err);
        return res.status(500).json({
            message: "Server error during login"
        });
    }
};

// Allow an authenticated patient to change their own password
exports.changePassword = async (req, res) => {

    try {
        const { patientId } = req.patient;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        const patient = await Patient.findOne({ UHID: patientId });
        if (!patient) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        const isMatch = Boolean(await bcrypt.compare(currentPassword, patient.passwordHash));
        if (!isMatch) {
            return res.status(401).json({
                message: "Current password is incorrect"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match!!"
            });
        }

        const samePassword = Boolean(await bcrypt.compare(newPassword, patient.passwordHash));
        if (samePassword) {
            return res.status(400).json({
                message: "New password cannot be the same as current password"
            });
        }

        patient.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        patient.mustChangePassword = false;
        await patient.save();

        return res.status(200).json({
            message: "Password changed successfully"
        });
    }
    catch (err) {
        console.error("Error during patient password change: ", err);
        return res.status(500).json({
            message: "Server error during password change"
        });
    }
};

// Generate a short-lived reset code and email it to the patient
exports.forgotPassword = async (req, res) => {

    try {
        const { email } = req.body;

        const patient = await Patient.findOne({ email });

        // Always return the same neutral response to avoid leaking which
        // emails are registered.
        const neutralResponse = () =>
            res.status(200).json({
                message: "If the email exists, a reset code has been sent"
            });

        if (!patient || patient.status !== "ACTIVE") {
            return neutralResponse();
        }

        // Store only the hash of the code; the raw value is emailed and never persisted.
        const resetCode = generateResetCode();
        patient.resetPasswordTokenHash = crypto
            .createHash("sha256")
            .update(resetCode)
            .digest("hex");
        patient.resetPasswordTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

        await patient.save();

        // dev only: print the code so it can be tested without a real inbox
        if (process.env.NODE_ENV !== "production") {
            console.log(`\n[DEV] Patient reset code for ${patient.email}: ${resetCode}\n`);
        }

        try {
            await sendEmail({
                to: patient.email,
                ...emailTemplates.patientPasswordResetCode({ resetCode })
            });
        } catch (emailError) {
            console.error("Email sending error:", emailError);
        }

        return neutralResponse();
    }
    catch (err) {
        console.error("Error during patient forgot password: ", err);
        return res.status(500).json({
            message: "Server error during forgot password"
        });
    }
};

// Validate the reset code and set a new password
exports.resetPassword = async (req, res) => {

    try {
        const { resetCode, newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match!!"
            });
        }

        const hashedCode = crypto
            .createHash("sha256")
            .update(resetCode)
            .digest("hex");

        const patient = await Patient.findOne({
            resetPasswordTokenHash: hashedCode,
            resetPasswordTokenExpiry: { $gt: new Date() }
        });

        if (!patient || patient.status !== "ACTIVE") {
            return res.status(400).json({
                message: "Invalid or expired reset code"
            });
        }

        const isSamePassword = Boolean(await bcrypt.compare(newPassword, patient.passwordHash));
        if (isSamePassword) {
            return res.status(400).json({
                message: "New password cannot be the same as current password"
            });
        }

        patient.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        // Clear the reset fields back to undefined so they drop out of the document
        patient.resetPasswordTokenHash = undefined;
        patient.resetPasswordTokenExpiry = undefined;
        patient.mustChangePassword = false;

        await patient.save();

        return res.status(200).json({
            message: "Password reset successful"
        });
    }
    catch (err) {
        console.error("Error during patient reset password: ", err);
        return res.status(500).json({
            message: "Server error during reset password"
        });
    }
};
