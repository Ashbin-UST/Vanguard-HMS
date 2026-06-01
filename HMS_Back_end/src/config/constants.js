// All staff designations that can be created or self-registered.
// OWNER and ADMIN are deliberately excluded (created through dedicated flows).
const STAFF_DESIGNATIONS = [
  "DOCTOR",
  "RECEPTIONIST",
  "CASHIER",
  "NURSE",
  "LAB_TECH",
  "PHARMACIST",
];

// All departments (matches the backend Employees schema enum).
const DEPARTMENTS = [
  "OPD",
  "IPD",
  "Lab",
  "Pharmacy",
  "Administration",
  "Reception",
  "Billing",
];

// Designations that require a medical registration number.
const MEDICAL_DESIGNATIONS = ["DOCTOR", "NURSE", "LAB_TECH", "PHARMACIST"];

// Designations that carry a specialization.
const SPECIALIZATION_DESIGNATIONS = ["DOCTOR", "LAB_TECH"];

// Privileged roles: created through dedicated flows, updated without approval,
// and never self-registerable.
const RESTRICTED_ROLES = ["OWNER", "ADMIN"];

/**
 * Valid staff designations for each department. Must stay in sync with the
 * frontend DEPARTMENT_DESIGNATIONS map. ADMIN/OWNER are intentionally excluded
 * (admins are not created through the staff/self-register flows), so
 * Administration has no staff-creatable designation here.
 */
const DEPARTMENT_DESIGNATIONS = {
  OPD: ["DOCTOR", "NURSE"],
  IPD: ["DOCTOR", "NURSE"],
  Lab: ["LAB_TECH"],
  Pharmacy: ["PHARMACIST"],
  Reception: ["RECEPTIONIST"],
  Billing: ["CASHIER"],
  Administration: [],
};

// Set variants for O(1) membership checks.
const STAFF_DESIGNATIONS_SET = new Set(STAFF_DESIGNATIONS);
const DEPARTMENTS_SET = new Set(DEPARTMENTS);
const MEDICAL_DESIGNATIONS_SET = new Set(MEDICAL_DESIGNATIONS);
const SPECIALIZATION_DESIGNATIONS_SET = new Set(SPECIALIZATION_DESIGNATIONS);
const RESTRICTED_ROLES_SET = new Set(RESTRICTED_ROLES);

module.exports = {
  STAFF_DESIGNATIONS,
  DEPARTMENTS,
  MEDICAL_DESIGNATIONS,
  SPECIALIZATION_DESIGNATIONS,
  RESTRICTED_ROLES,
  DEPARTMENT_DESIGNATIONS,
  STAFF_DESIGNATIONS_SET,
  DEPARTMENTS_SET,
  MEDICAL_DESIGNATIONS_SET,
  SPECIALIZATION_DESIGNATIONS_SET,
  RESTRICTED_ROLES_SET,
};