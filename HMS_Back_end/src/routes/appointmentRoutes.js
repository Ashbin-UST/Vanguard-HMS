const express = require("express");
const router = express.Router();
// const  = require("../models/HtmlContent");
const appointmentController = require("../controllers/appointmentController");


router.get("/", appointmentController.getAllAppointments);

// Ensure the router is exported
module.exports = router;