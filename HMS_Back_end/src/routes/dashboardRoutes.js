const express = require("express");
const router = express.Router();
// const  = require("../models/HtmlContent");
const dashboardController = require("../controllers/dashboardController");
const nodeController = require("../controllers/nodeController");


router.get("/operationreporttotal", dashboardController.getDashboardData);
router.get('/node/by-role', nodeController.getNodesByRole);
// Ensure the router is exported
module.exports = router;