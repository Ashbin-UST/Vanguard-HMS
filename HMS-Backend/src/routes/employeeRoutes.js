const express = require("express");
const router = express.Router();

const {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    toggleEmployeeStatus,
} = require("../controllers/employeeController");

const { protect, authorize } = require("../middleware/authMiddleware");

// All routes require ADMIN or OWNER
router.use(protect, authorize("ADMIN", "OWNER"));

// ── CRUD ──────────────────────────────────────────────────────
router.post("/", createEmployee);
router.get("/", getEmployees);
router.get("/:id", getEmployeeById);
router.put("/:id", updateEmployee);
router.patch("/:id/status", toggleEmployeeStatus);

module.exports = router;