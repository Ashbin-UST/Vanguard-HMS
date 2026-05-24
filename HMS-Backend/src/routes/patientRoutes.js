const express = require('express');
const {
    createPatient,
    getAllPatients,
    getPatientById,
    updatePatient,
    deletePatient,
    searchPatients
} = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create patient - RECEPTIONIST, NURSE, ADMIN, OWNER
router.post(
    '/',
    authorize('RECEPTIONIST', 'NURSE', 'ADMIN', 'OWNER'),
    createPatient
);

// Get all patients - RECEPTIONIST, NURSE, ADMIN, OWNER
router.get(
    '/',
    authorize('RECEPTIONIST', 'NURSE', 'ADMIN', 'OWNER'),
    getAllPatients
);

// Search patients - RECEPTIONIST, NURSE, ADMIN, OWNER
router.get(
    '/search',
    authorize('RECEPTIONIST', 'NURSE', 'ADMIN', 'OWNER'),
    searchPatients
);

// Get patient by ID - All authenticated users
router.get('/:id', getPatientById);

// Update patient - RECEPTIONIST, ADMIN, OWNER
router.put(
    '/:id',
    authorize('RECEPTIONIST', 'ADMIN', 'OWNER'),
    updatePatient
);

// Delete patient - ADMIN, OWNER only
router.delete(
    '/:id',
    authorize('ADMIN', 'OWNER'),
    deletePatient
);

module.exports = router;