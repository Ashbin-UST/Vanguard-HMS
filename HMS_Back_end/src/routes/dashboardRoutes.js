const express = require("express");
const router = express.Router();
// const  = require("../models/HtmlContent");
const dashboardController = require("../controllers/dashboardController");


router.get("/operationreporttotal", dashboardController.getDashboardData);
// Ensure the router is exported
module.exports = router;