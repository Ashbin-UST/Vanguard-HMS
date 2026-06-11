const sanitizeQualifications = require("./qualificationSanitizer");
const { SPECIALIZATION_DESIGNATIONS_SET } = require("../constants/domain");

const doctorOnlyFields = new Set(["consultationFee", "availabilitySlots"]);

// Apply allowed field updates to an employee document, enforcing designation-based restrictions
const updateEmployeeData = (employee, updateData) => {
  const allowedFields = [
    "name",
    "phone",
    "department",
    "designation",
    "joiningDate",
    "qualification",
    "medicalRegistrationNumber",
    "specialization",
    "consultationFee",
    "availabilitySlots",
  ];

  // Use the incoming designation if provided, otherwise keep the existing one
  const updatedDesignation = updateData.designation || employee.designation;

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {

      if (field === "qualification") {
        employee[field] = sanitizeQualifications(updateData[field]);

        return;
      }

      // Ignore specialization if the (new) designation does not support it
      if (
        field === "specialization" &&
        !SPECIALIZATION_DESIGNATIONS_SET.has(updatedDesignation)
      ) {
        return;
      }

      // Ignore doctor-only fields if the (new) designation is not DOCTOR
      if (doctorOnlyFields.has(field) && updatedDesignation !== "DOCTOR") {
        return;
      }

      employee[field] = updateData[field];
    }
  });

  // Clear specialization when the designation no longer supports it
  if (!SPECIALIZATION_DESIGNATIONS_SET.has(updatedDesignation)) {
    employee.specialization = undefined;
  }

  // Clear doctor-only fields when the designation is no longer DOCTOR
  if (updatedDesignation !== "DOCTOR") {
    employee.consultationFee = undefined;
    employee.availabilitySlots = undefined;
  }

  return employee;
};

module.exports = updateEmployeeData;