const express = require("express");
const router = express.Router();
// const  = require("../models/HtmlContent");
const auditController = require("../controllers/auditController");


router.get("/", auditController.getAllAuditLogs);

// Ensure the router is exported
module.exports = router;