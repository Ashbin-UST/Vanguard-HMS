const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/userModel');
const Employee = require('../models/employeeModel');
const {
    generateAccessToken,
    generateRefreshToken,
    generatePasswordResetToken,
    verifyAccessToken,
} = require('../utils/generateToken');
const {
    sendRegistrationPendingEmail,
    sendAdminNotificationEmail,
    sendPasswordResetEmail,
} = require('../utils/emailService');

const buildTokenPayload = (user) => ({
    id: user._id,
    userId: user.userId,
    email: user.email,
    roles: user.roles,
    status: user.status,
    employeeId: user.employeeId || null,
});

const VALID_ROLES = [
    'OWNER',
    'ADMIN',
    'DOCTOR',
    'RECEPTIONIST',
    'CASHIER',
    'NURSE',
    'LAB_TECH',
    'PHARMACIST',
];

const normalizeAndValidateRoles = (roles) => {
    const rolesArray = Array.isArray(roles) ? roles : [roles];

    const invalidRoles = rolesArray.filter((r) => !VALID_ROLES.includes(r));
    if (invalidRoles.length) {
        const error = new Error(
            `Invalid roles: [${invalidRoles.join(', ')}]. Valid: [${VALID_ROLES.join(', ')}]`
        );
        error.status = 400;
        throw error;
    }

    return rolesArray;
};

/**
 * ADMIN REGISTER - Original register function (for admin to create users)
 */
const register = async (req, res) => {
    try {
        const { email, password, roles, employeeId, status } = req.body;

        if (!email || !password || !roles) {
            return res.status(400).json({
                success: false,
                message: 'email, password, and roles are required',
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters',
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: `User with email "${email}" already exists`,
            });
        }

        const rolesArray = normalizeAndValidateRoles(roles);

        const isOwnerOrAdmin = rolesArray.some((r) => r === 'OWNER' || r === 'ADMIN');
        let validatedEmployeeId = null;

        if (!isOwnerOrAdmin) {
            if (!employeeId) {
                return res.status(400).json({
                    success: false,
                    message: `employeeId is required for roles: [${rolesArray.join(', ')}]`,
                });
            }

            const employee = await Employee.findOne({ employeeCode: employeeId });
            if (!employee) {
                return res.status(404).json({
                    success: false,
                    message: `Employee not found with ID: ${employeeId}`,
                });
            }

            if (employee.status === 'INACTIVE') {
                return res.status(400).json({
                    success: false,
                    message: `Employee "${employee.name}" is INACTIVE. Cannot create account`,
                });
            }

            const existingEmployeeUser = await User.findOne({ employeeId: employee._id });
            if (existingEmployeeUser) {
                return res.status(409).json({
                    success: false,
                    message: `Employee already has a user account: ${existingEmployeeUser.email}`,
                });
            }

            validatedEmployeeId = employee._id;
        }

        const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(12));

        const savedUser = await new User({
            email: normalizedEmail,
            passwordHash,
            roles: rolesArray,
            employeeId: validatedEmployeeId,
            status: status || 'ACTIVE',
            approvalStatus: 'APPROVED', // Admin-created users are auto-approved
        }).save();

        const populated = await User.findById(savedUser._id).populate(
            'employeeId',
            'employeeCode name designation department email phone'
        );

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                userId: populated.userId,
                email: populated.email,
                roles: populated.roles,
                status: populated.status,
                employee: populated.employeeId || null,
                createdAt: populated.createdAt,
            },
        });
    } catch (error) {
        console.log('register error:', error);

        if (error.status) {
            return res.status(error.status).json({ success: false, message: error.message });
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }

        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * SELF REGISTER - Employee self-registration (Flow 1)
 */
const selfRegister = async (req, res) => {
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
            password,
            roles,
        } = req.body;

        // Validate required fields
        if (!name || !phone || !email || !department || !designation || !password || !roles) {
            return res.status(400).json({
                success: false,
                message: 'Name, phone, email, department, designation, password, and roles are required',
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters',
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
        const rolesArray = normalizeAndValidateRoles(roles);

        // Don't allow OWNER/ADMIN self-registration
        if (rolesArray.some((r) => r === 'OWNER' || r === 'ADMIN')) {
            return res.status(403).json({
                success: false,
                message: 'Cannot self-register as OWNER or ADMIN',
            });
        }

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

        // Create Employee record
        const employee = await new Employee({
            name,
            phone,
            email: normalizedEmail,
            department,
            designation,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots,
            joiningDate: joiningDate || Date.now(),
            status: 'ACTIVE',
        }).save();

        // Create User record (PENDING approval)
        const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(12));

        const user = await new User({
            email: normalizedEmail,
            passwordHash,
            roles: rolesArray,
            employeeId: employee._id,
            status: 'ACTIVE',
            approvalStatus: 'PENDING', // Needs admin approval
        }).save();

        // Send email to employee
        console.log("Target Email: ", employee.email);
        await sendRegistrationPendingEmail(employee.email, employee.name);

        // Send notification to admin
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@hospital.com';
        await sendAdminNotificationEmail(adminEmail, employee.name, employee.email);

        return res.status(201).json({
            success: true,
            message: 'Registration successful! Your account is pending admin approval. You will receive an email once approved.',
            data: {
                userId: user.userId,
                email: user.email,
                roles: user.roles,
                approvalStatus: user.approvalStatus,
                employeeCode: employee.employeeCode,
            },
        });
    } catch (error) {
        console.log('selfRegister error:', error);

        if (error.status) {
            return res.status(error.status).json({ success: false, message: error.message });
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }

        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * LOGIN
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'email and password are required',
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim(),
        })
            .select('+passwordHash +refreshToken')
            .populate('employeeId', 'employeeCode name designation department email phone specialization');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        if (user.status === 'INACTIVE') {
            return res.status(403).json({
                success: false,
                message: 'Your account is INACTIVE. Contact administrator',
            });
        }

        // Check approval status
        if (user.approvalStatus === 'PENDING') {
            return res.status(403).json({
                success: false,
                message: 'Your account is pending admin approval. Please wait for approval email.',
            });
        }

        if (user.approvalStatus === 'REJECTED') {
            return res.status(403).json({
                success: false,
                message: 'Your account registration was rejected. Please contact administrator.',
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Check if temporary password needs reset
        if (user.isTemporaryPassword) {
            return res.status(403).json({
                success: false,
                message: 'You must reset your temporary password before logging in. Check your email for reset link.',
                requirePasswordReset: true,
            });
        }

        const payload = buildTokenPayload(user);
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken({ id: user._id });

        user.refreshToken = refreshToken;
        user.lastLoginAt = new Date();
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                userId: user.userId,
                email: user.email,
                roles: user.roles,
                status: user.status,
                employee: user.employeeId || null,
                lastLoginAt: user.lastLoginAt,
                tokens: {
                    accessToken,
                    refreshToken,
                },
            },
        });
    } catch (error) {
        console.log('login error: ', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET ME - Get current user profile
 */
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate(
            'employeeId',
            'employeeCode name designation department email phone specialization qualification consultationFee'
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'User Profile retrieved successfully',
            data: {
                userId: user.userId,
                email: user.email,
                roles: user.roles,
                status: user.status,
                approvalStatus: user.approvalStatus,
                employee: user.employeeId || null,
                lastLoginAt: user.lastLoginAt,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.log('Get User profile error: ', error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * FORGOT PASSWORD - Request password reset
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() }).populate(
            'employeeId',
            'name'
        );

        if (!user) {
            // Don't reveal if user exists or not
            return res.status(200).json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent.',
            });
        }

        // Generate reset token
        const resetToken = generatePasswordResetToken({ id: user._id, email: user.email });

        // Save hashed token to database
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send email
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        const userName = user.employeeId?.name || user.email;

        await sendPasswordResetEmail(user.email, userName, resetUrl);

        return res.status(200).json({
            success: true,
            message: 'Password reset link has been sent to your email',
        });
    } catch (error) {
        console.log('forgotPassword error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error sending password reset email',
        });
    }
};

/**
 * RESET PASSWORD - Reset password with token
 */
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required',
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters',
            });
        }

        // Verify token
        let decoded;
        try {
            decoded = verifyAccessToken(token);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token',
            });
        }

        // Hash token and find user
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            _id: decoded.id,
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        }).select('+resetPasswordToken +resetPasswordExpires');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token',
            });
        }

        // Update password
        user.passwordHash = await bcrypt.hash(newPassword, await bcrypt.genSalt(12));
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        user.isTemporaryPassword = false; // Clear temp password flag
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Password reset successful. You can now login with your new password.',
        });
    } catch (error) {
        console.log('resetPassword error:', error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * CHANGE PASSWORD - Change password (authenticated users)
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required',
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters',
            });
        }

        const user = await User.findById(req.user.id).select('+passwordHash');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        // Update password
        user.passwordHash = await bcrypt.hash(newPassword, await bcrypt.genSalt(12));
        user.isTemporaryPassword = false; // Clear temp password flag
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        console.log('changePassword error:', error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    register,
    selfRegister,
    login,
    getMe,
    forgotPassword,
    resetPassword,
    changePassword,
};