const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRolesMiddleware");
const controller = require("../controllers/adminController");
const { employeeBaseValidators } = require("../validators/employeeValidation");

router.use(auth, authorizeRoles("OWNER", "ADMIN"));

// Full employee field set plus joining date (required at creation)
const employeeCreationValidation = [
  ...employeeBaseValidators,
  body("joiningDate").notEmpty().withMessage("Joining date is required"),
];

// Validates the employeeCode URL parameter
const employeeCodeValidation = [
  param("employeeCode").notEmpty().withMessage("Employee Code is required"),
];

// Employee management routes
router.post(
  "/create-employee",
  employeeCreationValidation,
  validate,
  controller.createEmployee,
);

router.get("/employees", controller.getEmployees);

router.get(
  "/employees/:employeeCode",
  employeeCodeValidation,
  validate,
  controller.getEmployee,
);

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

// Audit log route
router.get("/audit-logs", controller.getAuditLogs);

// Profile change request routes
router.get("/profile-change-requests", controller.getProfileChangeRequests);

// Validates the requestId URL parameter
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
