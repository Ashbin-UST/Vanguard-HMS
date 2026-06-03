const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRolesMiddleware");
const controller = require("../controllers/adminController");
const { employeeBaseValidators } = require("../validators/employeeValidation");

// All the routes require authentication and admin-level authorization
router.use(auth, authorizeRoles("OWNER", "ADMIN"));

// Full employee field set plus joining date
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

module.exports = router;