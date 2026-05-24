const express = require('express');
const {
    getPendingApprovals,
    approveEmployee,
    rejectEmployee,
    createEmployeeWithTempPassword,
    getAllUsers,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All admin routes require authentication and ADMIN/OWNER role
router.use(protect);
router.use(authorize('ADMIN', 'OWNER'));

router.get('/pending-approvals', getPendingApprovals);
router.put('/approve/:userId', approveEmployee);
router.put('/reject/:userId', rejectEmployee);
router.post('/create-employee', createEmployeeWithTempPassword);
router.get('/users', getAllUsers);

module.exports = router;