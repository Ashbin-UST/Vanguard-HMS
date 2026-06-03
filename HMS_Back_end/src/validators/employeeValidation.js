const { body } = require("express-validator");
const {
  STAFF_DESIGNATIONS,
  DEPARTMENTS,
  MEDICAL_DESIGNATIONS_SET,
  SPECIALIZATION_DESIGNATIONS_SET,
  DEPARTMENT_DESIGNATIONS,
} = require("../config/constants");

// Shared phone format: optional country code prefix followed by exactly 10 digits
const PHONE_REGEX = /^(\+\d{1,3} )?\d{10}$/;

// Parses "HH:mm" into total minutes; returns null for invalid input
const toMinutes = (t) => {
  const m = /^(\d{2}):(\d{2})$/.exec(String(t || "").trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

// Core validators shared by employee creation (admin), admin creation (owner), and self-registration
const employeeBaseValidators = [
  body("username").notEmpty().withMessage("Username is required"),
  body("name").notEmpty().withMessage("Name is required"),
  body("phone")
    .matches(PHONE_REGEX)
    .withMessage(
      "Phone must be 10 digits, optionally prefixed with a country code and a space (e.g. +91 1234567890 or 1234567890)",
    ),
  body("email").isEmail().withMessage("Valid email is required"),
  body("department").isIn(DEPARTMENTS).withMessage("Valid department is required"),
  body("designation")
    .isIn(STAFF_DESIGNATIONS)
    .withMessage("Valid designation is required")
    .bail()
    .custom((designation, { req }) => {
      const dept = req.body.department;
      const valid = DEPARTMENT_DESIGNATIONS[dept];
      if (valid && !valid.includes(designation)) {
        throw new Error(
          `Designation ${designation} is not valid for the ${dept} department`,
        );
      }
      return true;
    }),
  body("qualification")
    .isArray({ min: 1 })
    .withMessage("At least one qualification is required"),

  // Medical registration number is required for medical designations
  body("medicalRegistrationNumber")
    .if((value, { req }) => MEDICAL_DESIGNATIONS_SET.has(req.body.designation))
    .notEmpty()
    .withMessage("Medical registration number is required"),

  // Specialization is required for designations that carry one
  body("specialization")
    .if((value, { req }) => SPECIALIZATION_DESIGNATIONS_SET.has(req.body.designation))
    .notEmpty()
    .withMessage("Specialization is required"),
  
  // DOCTOR only fields
  body("consultationFee")
    .if(body("designation").equals("DOCTOR"))
    .notEmpty()
    .withMessage("Consultation fee is required for doctor"),

  // Each slot's start must precede its end
  body("availabilitySlots")
    .if(body("designation").equals("DOCTOR"))
    .isArray({ min: 1 })
    .withMessage("Availability slots are required for doctor")
    .bail()
    .custom((slots) => {
      for (const slot of slots) {
        const start = toMinutes(slot?.startTime);
        const end = toMinutes(slot?.endTime);
        if (start === null || end === null || start >= end) {
          throw new Error("Each slot's start time must be before its end time");
        }
      }
      return true;
    }),
];

module.exports = { employeeBaseValidators, PHONE_REGEX };