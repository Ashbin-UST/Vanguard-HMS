const express = require('express');
const router = express.Router();

const { createEmployee } = require('../controllers/employeeController');


const { protect, authorize } = require("../middleware/authMiddleware");

router.post('/', createEmployee);

module.exports = router;