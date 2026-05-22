const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const authAdmin = require("../middlewares/authorizeAdminMiddleware")
const controller = require("../controllers/authController");

const allowedDesignationTypes = ['OWNER', 'ADMIN', 'DOCTOR', 'RECEPTIONIST', 
  'CASHIER', 'NURSE', 'LAB_TECH', 'PHARMACIST'];
const allowedDepartmentTypes = ["OPD", "IPD", "Lab", "Pharmacy", "Administration", "Reception", "Billing"];

const signUpValidation = [
    body('name').notEmpty().withMessage('Name is required!!'),
    body('phone').notEmpty().withMessage('Phone Number is required!!'),
    body('email').isEmail().withMessage('Invalid Email format!!'),
    body('password').notEmpty().withMessage('Password is required!!'),
    body('department').isIn(allowedDepartmentTypes).withMessage('Valid Department is required!!'),
    body('designation').isIn(allowedDesignationTypes).withMessage('Valid Designation is required!!'),
    body('joiningDate').notEmpty().withMessage('Joining Date is required!!'),
    body('medicalRegistrationNumber')
      .if((value, { req }) => ["DOCTOR", "NURSE", "LAB_TECH", "PHARMACIST"]
      .includes(req.body.designation)).notEmpty()
      .withMessage("Medical Registration Number is required!!"),
    body('specialization')
      .if((value, { req }) => ["DOCTOR","LAB_TECH"]
      .includes(req.body.designation)).notEmpty()
      .withMessage("Specialization is required!!"),
    body("qualification").isAlpha().withMessage("Qualification must contain only alphabetic characters!!"),
    body('consultationFee')
      .if(body("designation").equals("DOCTOR"))
      .notEmpty().withMessage("Consultation Fee is required for Doctor!!"),
    body("availabilitySlots")
      .if(body("designation").equals("DOCTOR"))
      .isArray({ min: 1 })
      .withMessage("Availability Slots are required for Doctor!!")
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

router.post("/signup", signUpValidation, validate, controller.signup);
router.get("/verify-email", controller.verifyEmail);
router.post("/login", loginValidation, validate, controller.login);
router.get("/profile", auth, controller.profile);
router.put("/selfUpdate", auth, controller.updateMyProfile);
router.put("/updateEmployee/:employeeCode", auth, authAdmin, controller.updateEmployee);
router.delete("/deleteEmployee/:employeeCode", auth, controller.deleteEmployee);

module.exports = router;