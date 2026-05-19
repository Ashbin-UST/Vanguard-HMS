const express = require("express");
const router = express.Router();

const auth = require("../middlewares/authMiddleware");

// const controller = require("../controllers/employeeController");

router.use(auth);

router.get(
    "/profile"
);

router.put(
    "/update-profile"
);

router.get(
    "/schedule"
);

module.exports = router;