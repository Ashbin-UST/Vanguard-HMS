const express = require("express");
const router = express.Router();

const { body } = require("express-validator");

const validate = require("../middlewares/validate");

const auth = require("../middlewares/authMiddleware");
const authorizeAdmin = require("../middlewares/authorizeAdminMiddleware");

// const controller = require("../controllers/adminController");

router.use(auth, authorizeAdmin);

const allowedDesignationTypes = [
    "DOCTOR",
    "RECEPTIONIST",
    "CASHIER",
    "NURSE",
    "LAB_TECH",
    "PHARMACIST"
];

const allowedDepartmentTypes = [
    "OPD",
    "IPD",
    "Lab",
    "Pharmacy",
    "Administration",
    "Reception",
    "Billing"
];

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
        .isIn(allowedDepartmentTypes)
        .withMessage("Valid department is required"),

    body("designation")
        .isIn(allowedDesignationTypes)
        .withMessage("Valid designation is required"),

    body("joiningDate")
        .notEmpty()
        .withMessage("Joining date is required"),

    body("qualification")
        .isArray({ min: 1 })
        .withMessage("At least one qualification is required"),

    body("medicalRegistrationNumber")
        .if((value, { req }) =>
            ["DOCTOR", "NURSE", "LAB_TECH", "PHARMACIST"]
                .includes(req.body.designation)
        )
        .notEmpty()
        .withMessage("Medical registration number is required"),

    body("specialization")
        .if((value, { req }) =>
            ["DOCTOR", "LAB_TECH"]
                .includes(req.body.designation)
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

router.post(
    "/create-employee",
    employeeCreationValidation,
    validate
);

router.get(
    "/employees"
);

router.get(
    "/pending-employees"
);

router.put(
    "/approve-employee/:employeeCode"
);

router.put(
    "/reject-employee/:employeeCode"
);

router.put(
    "/update-employee/:employeeCode"
);

router.delete(
    "/delete-employee/:employeeCode"
);

module.exports = router;