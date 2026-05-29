const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRolesMiddleware");
const controller = require("../controllers/ownerController");

// All routes require authentication and owner authorization
router.use(auth, authorizeRoles("OWNER"));

const adminCreationValidation = [

    body("username")
        .notEmpty()
        .withMessage("Username is required"),

    body("name")
        .notEmpty()
        .withMessage("Name is required"),

    body("phone")
        .matches(/^\+\d{1,3}\d{10}$/)
        .withMessage("Phone must include a country code (e.g. +91) followed by exactly 10 digits"),

    body("email")
        .isEmail()
        .withMessage("Valid email is required"),

    body("department")
        .equals("Administration")
        .withMessage("Admin must belong to Administration department"),

    body("designation")
        .equals("ADMIN")
        .withMessage("Designation must be ADMIN"),

    body("joiningDate")
        .isISO8601()
        .toDate()
        .withMessage("Valid joining date is required"),

    body("qualification")
        .isArray({ min: 1 })
        .withMessage("At least one qualification is required")
];

const employeeCodeValidation = [
    param("employeeCode")
        .notEmpty()
        .withMessage("Employee Code is required")
];

router.post(
    "/create-admin",
    adminCreationValidation,
    validate,
    controller.createAdmin
);

router.get(
    "/admins",
    controller.getAdmins
);

router.put(
    "/update-admin/:employeeCode",
    employeeCodeValidation,
    validate,
    controller.updateAdmin
);

router.delete(
    "/delete-admin/:employeeCode",
    employeeCodeValidation,
    validate,
    controller.deleteAdmin
);

module.exports = router;