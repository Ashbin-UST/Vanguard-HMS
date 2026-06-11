const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const Patient = require("../models/Patients");
const sendEmail = require("../utils/sendEmail");
const emailTemplates = require("../utils/emailTemplates");
const { toSafePatient } = require("../utils/toSafePatient");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/apiResponse");
const STATUS = require("../constants/statusCodes");
const MESSAGES = require("../constants/messages");
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
        throw new AppError(STATUS.CONFLICT, MESSAGES.PATIENT.ALREADY_REGISTERED);
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

    return sendSuccess(res, STATUS.CREATED, MESSAGES.PATIENT.REGISTER_SUCCESS, {
        patient: toSafePatient(patient)
    });
};

// Authenticate a patient by email + password and return a JWT
exports.login = async (req, res) => {

    const { email, password } = req.body;

    const patient = await Patient.findOne({ email });
    if (!patient) {
        throw new AppError(STATUS.UNAUTHORIZED, MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const isMatch = Boolean(await bcrypt.compare(password, patient.passwordHash));
    if (!isMatch) {
        throw new AppError(STATUS.UNAUTHORIZED, MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    if (patient.status !== "ACTIVE") {
        throw new AppError(STATUS.FORBIDDEN, MESSAGES.AUTH.ACCOUNT_INACTIVE);
    }

    const token = signPatientToken(patient);

    return sendSuccess(res, STATUS.OK, MESSAGES.AUTH.LOGIN_SUCCESS, {
        token,
        patient: toSafePatient(patient)
    });
};

// Allow an authenticated patient to change their own password
exports.changePassword = async (req, res) => {

    const { patientId } = req.patient;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const patient = await Patient.findOne({ UHID: patientId });
    if (!patient) {
        throw new AppError(STATUS.NOT_FOUND, MESSAGES.PATIENT.NOT_FOUND);
    }

    const isMatch = Boolean(await bcrypt.compare(currentPassword, patient.passwordHash));
    if (!isMatch) {
        throw new AppError(STATUS.UNAUTHORIZED, MESSAGES.AUTH.CURRENT_PASSWORD_INCORRECT);
    }

    if (newPassword !== confirmPassword) {
        throw new AppError(STATUS.BAD_REQUEST, MESSAGES.AUTH.PASSWORDS_DO_NOT_MATCH);
    }

    const samePassword = Boolean(await bcrypt.compare(newPassword, patient.passwordHash));
    if (samePassword) {
        throw new AppError(STATUS.BAD_REQUEST, MESSAGES.AUTH.PASSWORD_SAME_AS_CURRENT);
    }

    patient.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    patient.mustChangePassword = false;
    await patient.save();

    return sendSuccess(res, STATUS.OK, MESSAGES.AUTH.PASSWORD_CHANGED);
};

// Generate a short-lived reset code and email it to the patient
exports.forgotPassword = async (req, res) => {

    const { email } = req.body;

    const patient = await Patient.findOne({ email });

    // Always return the same neutral response to avoid leaking which
    // emails are registered.
    const neutralResponse = () =>
        sendSuccess(res, STATUS.OK, MESSAGES.AUTH.RESET_CODE_SENT);

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

    // Email failures must not break the neutral response
    try {
        await sendEmail({
            to: patient.email,
            ...emailTemplates.patientPasswordResetCode({ resetCode })
        });
    } catch (emailError) {
        console.error("Email sending error:", emailError);
    }

    return neutralResponse();
};

// Validate the reset code and set a new password
exports.resetPassword = async (req, res) => {

    const { resetCode, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        throw new AppError(STATUS.BAD_REQUEST, MESSAGES.AUTH.PASSWORDS_DO_NOT_MATCH);
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
        throw new AppError(STATUS.BAD_REQUEST, MESSAGES.AUTH.INVALID_RESET_CODE);
    }

    const isSamePassword = Boolean(await bcrypt.compare(newPassword, patient.passwordHash));
    if (isSamePassword) {
        throw new AppError(STATUS.BAD_REQUEST, MESSAGES.AUTH.PASSWORD_SAME_AS_CURRENT);
    }

    patient.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    // Clear the reset fields back to undefined so they drop out of the document
    patient.resetPasswordTokenHash = undefined;
    patient.resetPasswordTokenExpiry = undefined;
    patient.mustChangePassword = false;

    await patient.save();

    return sendSuccess(res, STATUS.OK, MESSAGES.AUTH.PASSWORD_RESET_SUCCESS);
};
