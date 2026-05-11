const express = require("express");
const router = express.Router(); 


const { signupValidation } =require('../validation/authValidation');
const validate = require('../middlewares/validate')
const{signup,login,me} = require("../controllers/authController")
const auth = require("../middlewares/authMiddleware")

router.post("/signup",signupValidation,validate,signup);
router.post("/login",login);
router.get("/me",auth,me)

module.exports = router;