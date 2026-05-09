const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const controller = require("../controllers/authController");

const signUpValidation = [
    body("email").isEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

router.post("/signup", signUpValidation, validate, controller.signup);
router.post("/login", loginValidation, validate, controller.login);

module.exports = router;