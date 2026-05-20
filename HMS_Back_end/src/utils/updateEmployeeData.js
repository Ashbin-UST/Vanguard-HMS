const sanitizeQualifications = require("./qualificationSanitizer");

const specializationFields = new Set(["DOCTOR", "LAB_TECH"]);

const doctorOnlyFields = new Set(["consultationFee", "availabilitySlots"]);

const updateEmployeeData = (employee, updateData) => {
  const allowedFields = [
    "name",
    "phone",
    "department",
    "designation",
    "qualification",
    "specialization",
    "consultationFee",
    "availabilitySlots",
  ];

  // Determine final designation after update
  const updatedDesignation = updateData.designation || employee.designation;

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {

      // Sanitize qualifications
      if (field === "qualification") {
        employee[field] = sanitizeQualifications(updateData[field]);

        return;
      }

      // Restrict specialization
      if (
        field === "specialization" &&
        !specializationFields.has(updatedDesignation)
      ) {
        return;
      }

      // Restrict doctor-only fields
      if (doctorOnlyFields.has(field) && updatedDesignation !== "DOCTOR") {
        return;
      }

      employee[field] = updateData[field];
    }
  });

  // Remove specialization if invalid for designation
  if (!specializationFields.has(updatedDesignation)) {
    employee.specialization = undefined;
  }

  // Remove doctor-only fields if designation is not DOCTOR
  if (updatedDesignation !== "DOCTOR") {
    employee.consultationFee = undefined;
    employee.availabilitySlots = undefined;
  }

  return employee;
};

module.exports = updateEmployeeData;