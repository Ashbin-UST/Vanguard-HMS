const express = require("express");
const router = express.Router();

const { body, param } = require("express-validator");

const validate = require("../middlewares/validate");

const auth = require("../middlewares/authMiddleware");
const authorizeOwner = require("../middlewares/authorizeOwnerMiddleware");

const controller = require("../controllers/ownerController");

router.use(auth, authorizeOwner);

const adminCreationValidation = [

    body("username")
        .notEmpty()
        .withMessage("Username is required"),

    body("name")
        .notEmpty()
        .withMessage("Name is required"),

    body("phone")
        .notEmpty()
        .withMessage("Phone number is required"),

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
        .notEmpty()
        .withMessage("Joining date is required"),

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