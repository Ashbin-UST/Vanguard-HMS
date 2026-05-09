const {body} = require('express-validator')

const signupValidation = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("designation")
    .isIn(['OWNER','DOCTOR','NURSE','RECEPTIONIST','CASHIER',
            'LAB_TECH','PHARMACIST','ADMIN'])
    .withMessage("Role mismatch"),
  body("name")
    .notEmpty()
    .withMessage("Name is required"),
 body("phone")
    .notEmpty()
    .isLength({min:10})
    .withMessage("phone number must be 10 digits"),
  body("department")
    .isIn(['OPD','IPD','LAB','PHARMACY','ADMIN'])
    .withMessage("Dept mismatch"), 

  body("joiningDate")
    .isDate()
    .withMessage("proper Date Fromat required")
];



module.exports = {signupValidation};