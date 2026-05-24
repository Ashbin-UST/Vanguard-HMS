const express = require('express');
const {
    register,
    selfRegister,
    login,
    getMe,
    forgotPassword,
    resetPassword,
    changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register); // Admin register (original)
router.post('/self-register', selfRegister); // Employee self-registration
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

module.exports = router;