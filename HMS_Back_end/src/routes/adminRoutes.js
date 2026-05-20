const express = require("express");
const router = express.Router();

const { body, param } = require("express-validator");

const validate = require("../middlewares/validate");

const auth = require("../middlewares/authMiddleware");
const authorizeAdmin = require("../middlewares/authorizeAdminMiddleware");

const controller = require("../controllers/adminController");

router.use(auth, authorizeAdmin);

const allowedDesignationTypes = new Set([
    "DOCTOR",
    "RECEPTIONIST",
    "CASHIER",
    "NURSE",
    "LAB_TECH",
    "PHARMACIST"
]);

const allowedDepartmentTypes = new Set([
    "OPD",
    "IPD",
    "Lab",
    "Pharmacy",
    "Administration",
    "Reception",
    "Billing"
]);

const medicalFields = new Set([
  "DOCTOR",
  "NURSE",
  "LAB_TECH",
  "PHARMACIST"
]);

const specializationFields = new Set([
    "DOCTOR", 
    "LAB_TECH"
]);

const employeeCreationValidation = [

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
        .isIn([...allowedDepartmentTypes])
        .withMessage("Valid department is required"),

    body("designation")
        .isIn([...allowedDesignationTypes])
        .withMessage("Valid designation is required"),

    body("joiningDate")
        .notEmpty()
        .withMessage("Joining date is required"),

    body("qualification")
        .isArray({ min: 1 })
        .withMessage("At least one qualification is required"),

    body("medicalRegistrationNumber")
        .if((value, { req }) =>
            medicalFields.has(req.body.designation)
        )
        .notEmpty()
        .withMessage("Medical registration number is required"),

    body("specialization")
        .if((value, { req }) =>
            specializationFields.has(req.body.designation)
        )
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
];

const employeeCodeValidation = [
    param("employeeCode")
        .notEmpty()
        .withMessage("Employee Code is required")
];

router.post(
    "/create-employee",
    employeeCreationValidation,
    validate,
    controller.createEmployee
);

router.get(
    "/employees",
    controller.getEmployees
);

router.get(
    "/pending-employees",
    controller.getPendingEmployees
);

router.put(
    "/approve-employee/:employeeCode",
    employeeCodeValidation,
    validate,
    controller.approveEmployee
);

router.put(
    "/reject-employee/:employeeCode",
    employeeCodeValidation,
    validate,
    controller.rejectEmployee
);

router.put(
    "/update-employee/:employeeCode",
    employeeCodeValidation,
    validate,
    controller.updateEmployee
);

router.delete(
    "/delete-employee/:employeeCode",
    employeeCodeValidation,
    validate,
    controller.deleteEmployee
);

module.exports = router;