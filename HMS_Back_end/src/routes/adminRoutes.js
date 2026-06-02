const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRolesMiddleware");
const controller = require("../controllers/adminController");
const { employeeBaseValidators } = require("../validators/employeeValidation");

// All routes require authentication and admin authorization
router.use(auth, authorizeRoles("OWNER", "ADMIN"));

const employeeCreationValidation = [
  ...employeeBaseValidators,
  body("joiningDate").notEmpty().withMessage("Joining date is required"),
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
