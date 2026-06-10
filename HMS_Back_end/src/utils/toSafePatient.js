// Shared serialization for patient-facing responses: the password hash and the
// password-reset token fields must never be returned to the client.

// Mongoose .select() string that excludes the sensitive/internal fields on reads
const PATIENT_SAFE_PROJECTION =
    "-passwordHash -resetPasswordTokenHash -resetPasswordTokenExpiry -__v";

// Strip the sensitive/internal fields from a patient document before returning it
const toSafePatient = (patient) => {
    const safe = patient.toObject();
    delete safe.passwordHash;
    delete safe.resetPasswordTokenHash;
    delete safe.resetPasswordTokenExpiry;
    delete safe.__v;
    return safe;
};

module.exports = { toSafePatient, PATIENT_SAFE_PROJECTION };
