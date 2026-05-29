const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const authorizeDesignation = require("../middlewares/authorizeDesignations");
const controller = require("../controllers/medicalRecordsController");

// All routes require authentication and doctor authorization
router.use(auth, authorizeDesignation("OWNER", "ADMIN", "DOCTOR", "NURSE"));

// Medical Record endpoints
router.post(
    "/create",
    body("appointmentId").notEmpty().withMessage("Appointment ID is required"),
    body("patientId").notEmpty().withMessage("Patient ID is required"),
    body("doctorEmployeeId").notEmpty().withMessage("Doctor ID is required"),
    body("diagnosis").optional().isString(),
    body("prescriptionItems").optional().isArray(),
    body("notes").optional().isString(),
    validate,
    controller.createMedicalRecord
);

router.get(
    "/",
    controller.getAllRecords
);

router.get(
    "/:id",
    controller.getRecordById
);

router.put(
    "/:id",
    controller.updateRecord
);

router.delete(
    "/:id",
    controller.deleteRecord
);

router.get(
    "/patient/:patientId",
    controller.getPatientRecords
);

module.exports = router;
