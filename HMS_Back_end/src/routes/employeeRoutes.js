const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const controller = require("../controllers/employeeController");

// All routes require authentication
router.use(auth);

router.get(
    "/profile",
    auth,
    controller.getProfile
);

router.put(
    "/update-profile"
);

router.get(
    "/schedule"
);

module.exports = router;