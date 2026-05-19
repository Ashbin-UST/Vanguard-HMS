const express = require("express");

const router = express.Router();

const { signupValidation } = require("../validation/authValidation");

const validate = require("../middleware/validate");

const authmiddleware = require("../middleware/authmiddleware");

const { signup, login, getProfile } = require("../controllers/authcontroller");


router.post("/signup", signupValidation, validate, signup);

router.post("/login", login);

router.get("/me", authmiddleware, getProfile);


module.exports = router;