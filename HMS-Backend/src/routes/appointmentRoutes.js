const express = require('express');
const {
    createAppointment,
    getAllAppointments,
    getMyAppointments,
    getDoctorAppointments,
    getPatientAppointments,
    getTodayAppointments,
    getAppointmentById,
    updateAppointmentStatus,
    addDoctorNotes,
    cancelAppointment,
    deleteAppointment,
    getAvailableSlots,
    getAvailableDoctors
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get available doctors - RECEPTIONIST, ADMIN, OWNER
router.get(
    '/doctors/available',
    authorize('RECEPTIONIST', 'ADMIN', 'OWNER'),
    getAvailableDoctors
);

// Get available time slots for a doctor - RECEPTIONIST, ADMIN, OWNER
router.get(
    '/doctors/:doctorId/slots',
    authorize('RECEPTIONIST', 'ADMIN', 'OWNER'),
    getAvailableSlots
);

// Get today's appointments - RECEPTIONIST, ADMIN, OWNER
router.get(
    '/today',
    authorize('RECEPTIONIST', 'ADMIN', 'OWNER'),
    getTodayAppointments
);

// Get my appointments - DOCTOR (own appointments)
router.get(
    '/my',
    authorize('DOCTOR'),
    getMyAppointments
);

// Get appointments for specific doctor - ADMIN, NURSE, OWNER
router.get(
    '/doctor/:doctorId',
    authorize('ADMIN', 'NURSE', 'OWNER'),
    getDoctorAppointments
);

// Get appointments for specific patient - RECEPTIONIST, ADMIN, OWNER
router.get(
    '/patient/:patientId',
    authorize('RECEPTIONIST', 'ADMIN', 'OWNER'),
    getPatientAppointments
);

// Create appointment - RECEPTIONIST, ADMIN, OWNER
router.post(
    '/',
    authorize('RECEPTIONIST', 'ADMIN', 'OWNER'),
    createAppointment
);

// Get all appointments - RECEPTIONIST, ADMIN, OWNER
router.get(
    '/',
    authorize('RECEPTIONIST', 'ADMIN', 'OWNER'),
    getAllAppointments
);

// Get appointment by ID - All authenticated users
router.get('/:id', getAppointmentById);

// Update appointment status - RECEPTIONIST, DOCTOR, ADMIN, OWNER
router.put(
    '/:id/status',
    authorize('RECEPTIONIST', 'DOCTOR', 'ADMIN', 'OWNER'),
    updateAppointmentStatus
);

// Add doctor notes - DOCTOR, ADMIN, OWNER
router.put(
    '/:id/notes',
    authorize('DOCTOR', 'ADMIN', 'OWNER'),
    addDoctorNotes
);

// Cancel appointment - RECEPTIONIST, ADMIN, OWNER
router.put(
    '/:id/cancel',
    authorize('RECEPTIONIST', 'ADMIN', 'OWNER'),
    cancelAppointment
);

// Delete appointment - ADMIN, OWNER only
router.delete(
    '/:id',
    authorize('ADMIN', 'OWNER'),
    deleteAppointment
);

module.exports = router;