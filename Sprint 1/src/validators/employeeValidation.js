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

const VALID_DAYS = new Set([
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY",
]);

const parseDay = (raw) => {
  if (!raw) throw new Error("Each availability slot must include a day");
  const day = String(raw).toUpperCase();
  if (!VALID_DAYS.has(day)) {
    throw new Error(`Invalid day "${raw}". Must be a full weekday name (e.g. MONDAY)`);
  }
  return day;
};

const parseTimeRange = (slot) => {
  const start = toMinutes(slot.startTime);
  const end = toMinutes(slot.endTime);
  if (start === null || end === null || start >= end) {
    throw new Error("Each slot's start time must be before its end time");
  }
  return { start, end };
};

const checkOverlap = (start, end, existingSlots, day, startTime, endTime) => {
  for (const e of existingSlots) {
    if (start < e.end && end > e.start) {
      throw new Error(
        `Overlapping slots on ${day}: ${startTime}–${endTime} overlaps with ${e.startTime}–${e.endTime}`
      );
    }
  }
};

const validateSlot = (slot, seen, byDay) => {
  const day = parseDay(slot?.day);
  const { start, end } = parseTimeRange(slot);

  const key = `${day}-${slot.startTime}-${slot.endTime}`;
  if (seen.has(key)) {
    throw new Error(`Duplicate slot: ${day} ${slot.startTime}–${slot.endTime}`);
  }
  seen.add(key);

  checkOverlap(start, end, byDay[day] || [], day, slot.startTime, slot.endTime);

  if (!byDay[day]) byDay[day] = [];
  byDay[day].push({ start, end, startTime: slot.startTime, endTime: slot.endTime });
};

// Core validators
const employeeBaseValidators = [
  body("username").notEmpty().withMessage("Username is required"),

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters long")
    .matches(/^[A-Za-z\s]+$/)
    .withMessage("Name must contain only alphabets and spaces"),

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

  body("joiningDate").isISO8601().toDate().withMessage("Valid joining date is required"),

  body("qualification")
    .isArray({ min: 1 })
    .withMessage("At least one qualification is required"),

  // Medical registration number is required for medical designations
  body("medicalRegistrationNumber")
    .if((value, { req }) => MEDICAL_DESIGNATIONS_SET.has(req.body.designation))
    .notEmpty()
    .withMessage("Medical registration number is required"),

  // Medical registration number must NOT be provided for non-medical designations
  body("medicalRegistrationNumber")
    .if((value, { req }) => !MEDICAL_DESIGNATIONS_SET.has(req.body.designation))
    .custom((value) => {
      if (value !== undefined && value !== null && value !== "") {
        throw new Error(
          "medicalRegistrationNumber is only applicable for DOCTOR, NURSE, and PHARMACIST designations",
        );
      }
      return true;
    }),

  // Specialization is required for designations that carry one
  body("specialization")
    .if((value, { req }) => SPECIALIZATION_DESIGNATIONS_SET.has(req.body.designation))
    .notEmpty()
    .withMessage("Specialization is required"),

  // Specialization must NOT be provided for non-specialization designations
  body("specialization")
    .if((value, { req }) => !SPECIALIZATION_DESIGNATIONS_SET.has(req.body.designation))
    .custom((value) => {
      if (value !== undefined && value !== null && value !== "") {
        throw new Error(
          "specialization is only applicable for DOCTOR and LAB_TECH designations",
        );
      }
      return true;
    }),

  // DOCTOR only fields
  body("consultationFee")
    .if(body("designation").equals("DOCTOR"))
    .notEmpty()
    .withMessage("Consultation fee is required for doctor"),

  // consultationFee must NOT be provided for non-doctor designations
  body("consultationFee")
    .if((value, { req }) => req.body.designation !== "DOCTOR")
    .custom((value) => {
      if (value !== undefined && value !== null && value !== "") {
        throw new Error(
          "consultationFee is only applicable for DOCTOR designation",
        );
      }
      return true;
    }),

  // Availability slots are required for doctor
  body("availabilitySlots")
    .if(body("designation").equals("DOCTOR"))
    .isArray({ min: 1 })
    .withMessage("Availability slots are required for doctor")
    .bail()
    .custom((slots) => {
      const seen = new Set();
      const byDay = {};
      for (const slot of slots) {
        validateSlot(slot, seen, byDay);
      }
      return true;
    }),

  // availabilitySlots must NOT be provided for non-doctor designations
  body("availabilitySlots")
    .if((value, { req }) => req.body.designation !== "DOCTOR")
    .custom((value) => {
      if (Array.isArray(value) && value.length > 0) {
        throw new Error(
          "availabilitySlots is only applicable for DOCTOR designation",
        );
      }
      return true;
    }),
];

module.exports = { employeeBaseValidators };