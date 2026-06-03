const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const controller = require("../controllers/employeeController");

// All the routes require authentication
router.use(auth);

// Current authenticated user + profile
router.get("/me", controller.getMe);

module.exports = router;