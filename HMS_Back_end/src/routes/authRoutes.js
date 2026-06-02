const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const controller = require("../controllers/authController");
const { employeeBaseValidators } = require("../validators/employeeValidation");
const { passwordStrengthValidator } = require("../utils/passwordValidator");

const selfRegisterValidation = [
  ...employeeBaseValidators,
  passwordStrengthValidator("password"),
  body("joiningDate").isISO8601().toDate().withMessage("Valid joining date is required"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  passwordStrengthValidator("newPassword"),
  body("confirmPassword").notEmpty().withMessage("Confirm password is required"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
];

const forgotPasswordValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
];

const resetPasswordValidation = [
  body("resetToken").notEmpty().withMessage("Reset token is required"),
  passwordStrengthValidator("newPassword"),
  body("confirmPassword").notEmpty().withMessage("Confirm password is required"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
];

router.post("/login", loginValidation, validate, controller.login);

router.post(
  "/self-register",
  selfRegisterValidation,
  validate,
  controller.selfRegister,
);

router.put(
  "/change-password",
  auth,
  changePasswordValidation,
  validate,
  controller.changePassword,
);

router.post(
  "/forgot-password",
  forgotPasswordValidation,
  validate,
  controller.forgotPassword,
);

router.post(
  "/reset-password",
  resetPasswordValidation,
  validate,
  controller.resetPassword,
);

router.post("/logout", auth, controller.logout);

router.get("/me", auth, controller.me);

module.exports = router;
