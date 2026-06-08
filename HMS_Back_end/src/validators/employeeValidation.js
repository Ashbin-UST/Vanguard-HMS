const { body } = require("express-validator");
const {
  nameValidator,
  phoneValidator,
  emailValidator,
} = require("./sharedValidators");
const {
  STAFF_DESIGNATIONS,
  DEPARTMENTS,
  MEDICAL_DESIGNATIONS_SET,
  SPECIALIZATION_DESIGNATIONS_SET,
  DEPARTMENT_DESIGNATIONS,
} = require("../config/constants");

// Parses "HH:mm" into total minutes; returns null for invalid input
const toMinutes = (t) => {
  const m = /^(\d{2}):(\d{2})$/.exec(String(t || "").trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

// Employee-only reusable field validators (reused by the employee/admin routes)
const usernameValidator = (field = "username", { optional = false } = {}) => {
  const chain = body(field);
  if (optional) {
    chain.optional();
  }
  return chain.notEmpty().withMessage("Username is required");
};

const qualificationValidator = (field = "qualification", { optional = false } = {}) => {
  const chain = body(field);
  if (optional) {
    chain.optional();
  }
  return chain
    .isArray({ min: 1 })
    .withMessage("At least one qualification is required");
};

const joiningDateValidator = (field = "joiningDate", { optional = false } = {}) => {
  const chain = body(field);
  if (optional) {
    chain.optional();
  }
  return chain
    .isISO8601()
    .toDate()
    .withMessage("Valid joining date is required");
};

// Core validators shared by employee creation (admin), admin creation (owner), and self-registration
const employeeBaseValidators = [
  usernameValidator(),
  nameValidator("name", "Name"),
  phoneValidator("phone"),
  emailValidator("email"),
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
  qualificationValidator(),

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

module.exports = {
  employeeBaseValidators,
  usernameValidator,
  qualificationValidator,
  joiningDateValidator,
};