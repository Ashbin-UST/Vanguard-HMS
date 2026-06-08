const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const controller = require("../controllers/authController");
const { employeeBaseValidators } = require("../validators/employeeValidation");
const { passwordStrengthValidator } = require("../validators/passwordValidator");

const registerValidation = [
  ...employeeBaseValidators,
  passwordStrengthValidator("password"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),

  body("password").notEmpty().withMessage("Password is required"),
];

router.post("/register", registerValidation, validate, controller.register);

router.post("/login", loginValidation, validate, controller.login);

router.get("/verify-email", controller.verifyEmail);

router.get("/me", auth, controller.me);

module.exports = router;