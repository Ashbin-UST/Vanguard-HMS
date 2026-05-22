const express = require("express");
const router = express.Router();
const htmlContent = require("../models/HtmlContent");
const htmlContentController = require("../controllers/htmlContentController");

// Get all HTML content
// router.get("/", htmlContentController.getAllHtmlContent);

// Ensure the router is exported
module.exports = router;