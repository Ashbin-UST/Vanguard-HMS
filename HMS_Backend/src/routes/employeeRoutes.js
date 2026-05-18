const express = require("express");
const router  = express.Router(); 

const auth = require("../middlewares/authMiddleware")
const authorizeAdmin = require("../middlewares/authorizeAdmin")

const {getAllEmployees,getEmployeeById,addEmployee,updateEmployee,deleteEmployee} = require("../controllers/employeeController")
router.get("/",auth,authorizeAdmin,getAllEmployees);
router.get("/:id",auth,authorizeAdmin,getEmployeeById);
router.post("/",auth,authorizeAdmin,addEmployee);
router.put("/:id",auth,authorizeAdmin,updateEmployee);
router.delete("/:id",auth,authorizeAdmin,deleteEmployee); 

module.exports = router;

