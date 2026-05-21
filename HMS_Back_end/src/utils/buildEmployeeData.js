const sanitizeQualifications = require("./qualificationSanitizer");

const medicalFields = new Set(["DOCTOR", "NURSE", "LAB_TECH", "PHARMACIST"]);

const specializationFields = new Set(["DOCTOR", "LAB_TECH"]);

const buildEmployeeData = (data) => {
  const {
    name,
    phone,
    email,
    department,
    designation,
    joiningDate,
    qualification,
    medicalRegistrationNumber,
    specialization,
    consultationFee,
    availabilitySlots,
  } = data;

  // Base employee data
  const employeeData = {
    name,
    phone,
    email,
    department,
    designation,
    joiningDate,
    qualification: sanitizeQualifications(qualification),
  };

  // Add medical registration number
  if (medicalFields.has(designation)) {
    employeeData.medicalRegistrationNumber = medicalRegistrationNumber;
  }

  // Add specialization
  if (specializationFields.has(designation)) {
    employeeData.specialization = specialization;
  }

  // Add doctor-only fields
  if (designation === "DOCTOR") {
    employeeData.consultationFee = consultationFee;
    employeeData.availabilitySlots = availabilitySlots?.map((slot) => ({
      ...slot,
      day: slot.day.toUpperCase(),
    }));
  }

  return employeeData;
};

module.exports = buildEmployeeData;