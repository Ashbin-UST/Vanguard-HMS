const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const authorizeDesignation = require("../middlewares/authorizeDesignations");
const controller = require("../controllers/billingController");

// All routes require authentication and billing authorization
router.use(auth, authorizeDesignation("OWNER", "ADMIN", "CASHIER", "RECEPTIONIST"));

// Bill endpoints
router.post(
    "/bills/create",
    body("patientId").notEmpty().withMessage("Patient ID is required"),
    body("appointmentId").notEmpty().withMessage("Appointment ID is required"),
    body("items").isArray().withMessage("Items must be an array"),
    body("total").isNumeric().withMessage("Total must be a number"),
    validate,
    controller.createBill
);

router.get(
    "/bills",
    controller.getAllBills
);

router.get(
    "/bills/:id",
    controller.getBillById
);

router.put(
    "/bills/:id",
    controller.updateBill
);

router.delete(
    "/bills/:id",
    controller.deleteBill
);

router.get(
    "/patient/:patientId/bills",
    controller.getPatientBills
);

// Payment endpoints
router.post(
    "/payments/create",
    body("billId").notEmpty().withMessage("Bill ID is required"),
    body("amount").isNumeric().withMessage("Amount must be a number"),
    body("method").isIn(['CASH', 'CARD', 'UPI']).withMessage("Invalid payment method"),
    validate,
    controller.createPayment
);

router.get(
    "/payments",
    controller.getAllPayments
);

router.get(
    "/payments/:id",
    controller.getPaymentById
);

module.exports = router;
