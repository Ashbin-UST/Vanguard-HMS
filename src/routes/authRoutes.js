const express = require("express");
const router = express.Router();

const { signupValidation } = require('../validators/authValidator');
const { loginValidation } = require('../validators/authValidator');
const validate = require('../middleware/validate')
const { signup } = require("../controllers/authController");
const { login } = require("../controllers/authController");


router.post("/signup", signupValidation, validate, signup);
router.post("/login", loginValidation, validate, login);

module.exports = router;