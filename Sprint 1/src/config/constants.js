const STAFF_DESIGNATIONS = [
  "OWNER",
  "ADMIN",
  "DOCTOR",
  "RECEPTIONIST",
  "CASHIER",
  "NURSE",
  "LAB_TECH",
  "PHARMACIST",
];

const DEPARTMENTS = [
  "OPD",
  "IPD",
  "Lab",
  "Pharmacy",
  "Administration",
  "Reception",
  "Billing",
];

const MEDICAL_DESIGNATIONS_SET = new Set(["DOCTOR", "NURSE", "PHARMACIST"]);

const SPECIALIZATION_DESIGNATIONS_SET = new Set(["DOCTOR", "LAB_TECH"]);

// Maps designation to the role stored on the User account
const DESIGNATION_ROLE_MAP = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
};

// Valid staff designations per department
const DEPARTMENT_DESIGNATIONS = {
  OPD: ["DOCTOR", "NURSE"],
  IPD: ["DOCTOR", "NURSE"],
  Lab: ["LAB_TECH"],
  Pharmacy: ["PHARMACIST"],
  Reception: ["RECEPTIONIST"],
  Billing: ["CASHIER"],
  Administration: ["OWNER", "ADMIN"],
};

module.exports = {
  STAFF_DESIGNATIONS,
  DEPARTMENTS,
  MEDICAL_DESIGNATIONS_SET,
  SPECIALIZATION_DESIGNATIONS_SET,
  DEPARTMENT_DESIGNATIONS,
  DESIGNATION_ROLE_MAP,
};