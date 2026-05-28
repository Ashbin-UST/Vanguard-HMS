const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/userModel');
const Employee = require('../models/employeeModel');
const {
    sendApprovalEmail,
    sendRejectionEmail,
    sendTemporaryPasswordEmail,
} = require('../utils/emailService');
const { generatePasswordResetToken } = require('../utils/generateToken');
const { generateTemporaryPassword } = require('../utils/passwordGenerator');

/**
 * GET PENDING APPROVALS
 */
const getPendingApprovals = async (req, res) => {
    try {
        const pendingUsers = await User.find({ approvalStatus: 'PENDING' })
            .populate('employeeId', 'employeeCode name designation department email phone specialization')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: 'Pending approvals retrieved successfully',
            data: pendingUsers.map((user) => ({
                userId: user.userId,
                email: user.email,
                roles: user.roles,
                status: user.status,
                approvalStatus: user.approvalStatus,
                employee: user.employeeId,
                createdAt: user.createdAt,
            })),
        });
    } catch (error) {
        console.log('getPendingApprovals error:', error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * APPROVE EMPLOYEE REGISTRATION
 */
const approveEmployee = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findOne({ userId }).populate('employeeId', 'name email');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (user.approvalStatus !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `User is already ${user.approvalStatus.toLowerCase()}`,
            });
        }

        user.approvalStatus = 'APPROVED';
        await user.save();

        // Send approval email
        const loginUrl = `${process.env.FRONTEND_URL}/login`;
        await sendApprovalEmail(user.email, user.employeeId?.name || user.email, loginUrl);

        return res.status(200).json({
            success: true,
            message: 'Employee approved successfully. Approval email sent.',
            data: {
                userId: user.userId,
                email: user.email,
                approvalStatus: user.approvalStatus,
            },
        });
    } catch (error) {
        console.log('approveEmployee error:', error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * REJECT EMPLOYEE REGISTRATION
 */
const rejectEmployee = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        const user = await User.findOne({ userId }).populate('employeeId', 'name email');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (user.approvalStatus !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: `User is already ${user.approvalStatus.toLowerCase()}`,
            });
        }

        user.approvalStatus = 'REJECTED';
        await user.save();

        // Send rejection email
        await sendRejectionEmail(user.email, user.employeeId?.name || user.email, reason);

        return res.status(200).json({
            success: true,
            message: 'Employee rejected successfully. Rejection email sent.',
            data: {
                userId: user.userId,
                email: user.email,
                approvalStatus: user.approvalStatus,
            },
        });
    } catch (error) {
        console.log('rejectEmployee error:', error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * CREATE EMPLOYEE
 */
const createEmployeeWithTempPassword = async (req, res) => {
    try {
        const {
            // Employee fields
            name,
            phone,
            email,
            department,
            designation,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots,
            joiningDate,
            // User fields
            roles,
        } = req.body;

        // Validate required fields
        if (!name || !phone || !email || !department || !designation || !roles) {
            return res.status(400).json({
                success: false,
                message: 'Name, phone, email, department, designation, and roles are required',
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if email already exists
        const existingEmployee = await Employee.findOne({ email: normalizedEmail });
        if (existingEmployee) {
            return res.status(409).json({
                success: false,
                message: `Employee with email "${email}" already exists`,
            });
        }

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: `User with email "${email}" already exists`,
            });
        }

        // Check phone uniqueness
        const existingPhone = await Employee.findOne({ phone });
        if (existingPhone) {
            return res.status(409).json({
                success: false,
                message: `Employee with phone number "${phone}" already exists`,
            });
        }

        // Validate roles
        const rolesArray = Array.isArray(roles) ? roles : [roles];
        const isOwnerOrAdmin = rolesArray.some((r) => r === 'OWNER' || r === 'ADMIN');

        // Check medicalRegistrationNo uniqueness if provided
        if (medicalRegistrationNo) {
            const existingRegNo = await Employee.findOne({ medicalRegistrationNo });
            if (existingRegNo) {
                return res.status(409).json({
                    success: false,
                    message: `Employee with Medical Registration No "${medicalRegistrationNo}" already exists`,
                });
            }
        }

        // Create Employee record (only if not OWNER/ADMIN)
        let employeeId = null;

        if (!isOwnerOrAdmin) {
            const employee = await new Employee({
                name,
                phone,
                email: normalizedEmail,
                department,
                designation,
                medicalRegistrationNo: req.body.medicalRegistrationNo?.trim() || undefined,
                specialization,
                qualification,
                consultationFee,
                availabilitySlots,
                joiningDate: joiningDate || Date.now(),
                status: 'ACTIVE',
            }).save();

            employeeId = employee._id;
        }

        // Generate temporary password
        const tempPassword = generateTemporaryPassword();
        const passwordHash = await bcrypt.hash(tempPassword, await bcrypt.genSalt(12));

        // Create User record
        const user = await new User({
            email: normalizedEmail,
            passwordHash,
            roles: rolesArray,
            employeeId,
            status: 'ACTIVE',
            approvalStatus: 'APPROVED', // Admin-created users are auto-approved
            isTemporaryPassword: true, // Flag for forced password reset
        }).save();

        // Generate reset token for temporary password
        const resetToken = generatePasswordResetToken({ id: user._id, email: user.email });
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = Date.now() + 24 * 3600000; // 24 hours for temp password
        await user.save();

        // Send email with temporary password
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        await sendTemporaryPasswordEmail(user.email, name, tempPassword, resetUrl);

        return res.status(201).json({
            success: true,
            message: 'Employee created successfully.Reset password link sent to email.',
            data: {
                userId: user.userId,
                email: user.email,
                roles: user.roles,
                employeeCode: employeeId ? (await Employee.findById(employeeId)).employeeCode : null,
            },
        });
    } catch (error) {
        console.log('createEmployeeWithTempPassword error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }

        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET ALL USERS (for admin dashboard)
 */
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .populate('employeeId', 'employeeCode name designation department email phone')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: 'All users retrieved successfully',
            data: users.map((user) => ({
                userId: user.userId,
                email: user.email,
                roles: user.roles,
                status: user.status,
                approvalStatus: user.approvalStatus,
                employee: user.employeeId,
                lastLoginAt: user.lastLoginAt,
                createdAt: user.createdAt,
            })),
        });
    } catch (error) {
        console.log('getAllUsers error:', error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getPendingApprovals,
    approveEmployee,
    rejectEmployee,
    createEmployeeWithTempPassword,
    getAllUsers,
};