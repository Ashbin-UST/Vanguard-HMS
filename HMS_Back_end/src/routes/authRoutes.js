const express = require("express");
const router = express.Router();

const { body } = require("express-validator");

const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");

// const controller = require("../controllers/authController");

const loginValidation = [

    body("email")
        .isEmail()
        .withMessage("Valid email is required"),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
];

const changePasswordValidation = [

    body("currentPassword")
        .notEmpty()
        .withMessage("Current password is required"),

    body("newPassword")
        .isLength({ min: 6 })
        .withMessage("New password must be at least 6 characters long"),

    body("confirmPassword")
        .notEmpty()
        .withMessage("Confirm password is required"),

    body("confirmPassword")
        .custom((value, { req }) => {

            if (value !== req.body.newPassword) {
                throw new Error("Passwords do not match");
            }

            return true;
        })
];

const forgotPasswordValidation = [

    body("email")
        .isEmail()
        .withMessage("Valid email is required")
];

const resetPasswordValidation = [

    body("token")
        .notEmpty()
        .withMessage("Reset token is required"),

    body("newPassword")
        .isLength({ min: 6 })
        .withMessage("New password must be at least 6 characters long"),

    body("confirmPassword")
        .notEmpty()
        .withMessage("Confirm password is required"),

    body("confirmPassword")
        .custom((value, { req }) => {

            if (value !== req.body.newPassword) {
                throw new Error("Passwords do not match");
            }

            return true;
        })
];

router.post(
    "/login",
    loginValidation,
    validate
    // controller.login
);

router.put(
    "/change-password",
    auth,
    changePasswordValidation,
    validate
    // controller.changePassword
);

router.post(
    "/forgot-password",
    forgotPasswordValidation,
    validate
    // controller.forgotPassword
);

router.post(
    "/reset-password",
    resetPasswordValidation,
    validate
    // controller.resetPassword
);

router.post(
    "/logout",
    auth
    // controller.logout
);

module.exports = router;