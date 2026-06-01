const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRolesMiddleware");
const controller = require("../controllers/adminController");

// All routes require authentication and admin authorization
router.use(auth, authorizeRoles("OWNER", "ADMIN"));

const allowedDesignationTypes = new Set([
  "DOCTOR",
  "RECEPTIONIST",
  "CASHIER",
  "NURSE",
  "LAB_TECH",
  "PHARMACIST",
]);

const allowedDepartmentTypes = new Set([
  "OPD",
  "IPD",
  "Lab",
  "Pharmacy",
  "Administration",
  "Reception",
  "Billing",
]);

const medicalFields = new Set(["DOCTOR", "NURSE", "LAB_TECH", "PHARMACIST"]);

const specializationFields = new Set(["DOCTOR", "LAB_TECH"]);

// Valid staff designations for each department. Must stay in sync with the
// frontend DEPARTMENT_DESIGNATIONS map. ADMIN/OWNER are intentionally excluded
// here (admins cannot be created through this route).
const departmentDesignations = {
  OPD: ["DOCTOR", "NURSE"],
  IPD: ["DOCTOR", "NURSE"],
  Lab: ["LAB_TECH"],
  Pharmacy: ["PHARMACIST"],
  Reception: ["RECEPTIONIST"],
  Billing: ["CASHIER"],
  Administration: [],
};

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
    .isIn([...allowedDepartmentTypes])
    .withMessage("Valid department is required"),

  body("designation")
    .isIn([...allowedDesignationTypes])
    .withMessage("Valid designation is required")
    .bail()
    .custom((designation, { req }) => {
      const dept = req.body.department;
      const valid = departmentDesignations[dept];
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
    .if((value, { req }) => medicalFields.has(req.body.designation))
    .notEmpty()
    .withMessage("Medical registration number is required"),

  body("specialization")
    .if((value, { req }) => specializationFields.has(req.body.designation))
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