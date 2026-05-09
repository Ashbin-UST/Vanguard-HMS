const express = require("express");
const router = express.Router();

const { signupValidation } =require('../validation/authValidation');
const validate = require('../middlewares/validate')
const{signup,login} = require("../controllers/authController")

router.post("/signup",signupValidation,validate,signup);
router.post("/login",login);

module.exports = router;