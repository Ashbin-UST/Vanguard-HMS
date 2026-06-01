const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRolesMiddleware");
const controller = require("../controllers/adminController");
const {
  STAFF_DESIGNATIONS,
  DEPARTMENTS,
  MEDICAL_DESIGNATIONS_SET,
  SPECIALIZATION_DESIGNATIONS_SET,
  DEPARTMENT_DESIGNATIONS,
} = require("../config/constants");

// All routes require authentication and admin authorization
router.use(auth, authorizeRoles("OWNER", "ADMIN"));

const employeeCreationValidation = [
  body("username").notEmpty().withMessage("Username is required"),

  body("name").notEmpty().withMessage("Name is required"),

  body("phone")
    .matches(/^(\+\d{1,3} )?\d{10}$/)
    .withMessage(
      "Phone must be 10 digits, optionally prefixed with a country code and a space (e.g. +91 1234567890 or 1234567890)",
    ),

  body("email").isEmail().withMessage("Valid email is required"),

  body("department")
    .isIn(DEPARTMENTS)
    .withMessage("Valid department is required"),

  body("designation")
    .isIn(STAFF_DESIGNATIONS)
    .withMessage("Valid designation is required")
    .bail()
    .custom((designation, { req }) => {
      const dept = req.body.department;
      const valid = DEPARTMENT_DESIGNATIONS[dept];
      // If the department is unknown, the department validator already failed.
      if (valid && !valid.includes(designation)) {
        throw new Error(
          `Designation ${designation} is not valid for the ${dept} department`,
        );
      }
      return true;
    }),

  body("joiningDate").notEmpty().withMessage("Joining date is required"),

  body("qualification")
    .isArray({ min: 1 })
    .withMessage("At least one qualification is required"),

  body("medicalRegistrationNumber")
    .if((value, { req }) => MEDICAL_DESIGNATIONS_SET.has(req.body.designation))
    .notEmpty()
    .withMessage("Medical registration number is required"),

  body("specialization")
    .if((value, { req }) => SPECIALIZATION_DESIGNATIONS_SET.has(req.body.designation))
    .notEmpty()
    .withMessage("Specialization is required"),

  body("consultationFee")
    .if(body("designation").equals("DOCTOR"))
    .notEmpty()
    .withMessage("Consultation fee is required for doctor"),

  body("availabilitySlots")
    .if(body("designation").equals("DOCTOR"))
    .isArray({ min: 1 })
    .withMessage("Availability slots are required for doctor")
    .bail()
    .custom((slots) => {
      const toMinutes = (t) => {
        const m = /^(\d{2}):(\d{2})$/.exec(String(t || "").trim());
        return m ? Number(m[1]) * 60 + Number(m[2]) : null;
      };
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

const employeeCodeValidation = [
  param("employeeCode").notEmpty().withMessage("Employee Code is required"),
];

router.post(
  "/create-employee",
  employeeCreationValidation,
  validate,
  controller.createEmployee,
);

router.get("/employees", controller.getEmployees);

router.get("/pending-employees", controller.getPendingEmployees);

router.put(
  "/approve-employee/:employeeCode",
  employeeCodeValidation,
  validate,
  controller.approveEmployee,
);

router.put(
  "/reject-employee/:employeeCode",
  employeeCodeValidation,
  validate,
  controller.rejectEmployee,
);

router.put(
  "/update-employee/:employeeCode",
  employeeCodeValidation,
  validate,
  controller.updateEmployee,
);

router.delete(
  "/delete-employee/:employeeCode",
  employeeCodeValidation,
  validate,
  controller.deleteEmployee,
);

// Audit logs (recent activity)
router.get("/audit-logs", controller.getAuditLogs);

// Profile change requests
router.get("/profile-change-requests", controller.getProfileChangeRequests);

const requestIdValidation = [
  param("requestId").notEmpty().withMessage("Request ID is required"),
];

router.put(
  "/approve-profile-change/:requestId",
  requestIdValidation,
  validate,
  controller.approveProfileChange,
);

router.put(
  "/reject-profile-change/:requestId",
  requestIdValidation,
  validate,
  controller.rejectProfileChange,
);

module.exports = router;