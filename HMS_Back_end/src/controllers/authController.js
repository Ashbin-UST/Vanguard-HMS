const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const User = require("../models/Users");
const Employee = require("../models/Employees");
const sendEmail = require("../utils/sendEmail");
const buildEmployeeProfile = require("../utils/buildEmployeeProfile");
require("dotenv").config();

// Login
exports.login = async (req, res) => {

    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isMatch = Boolean(await bcrypt.compare(password, user.passwordHash));
        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const blockedStatuses = {
            PENDING: "Admin approval is pending",
            REJECTED: "Registration request is rejected",
            INACTIVE: "Account is inactive"
        };

        const blockedMessage = blockedStatuses[user.status];

        if (blockedMessage) {
            return res.status(403).json({
                message: blockedMessage
            });
        }

        user.lastLoginAt = new Date();
        await user.save();

        const employee = await Employee.findOne({
            employeeCode: user.employeeCode
        }).select("-__v");

        if (!employee) {
            return res.status(404).json({
                message: "Employee profile not found!!"
            });
        }

        const profile = buildEmployeeProfile(employee);

        const token = jwt.sign(
            {
                employeeCode: user.employeeCode,
                roles: user.roles
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN
            }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                roles: user.roles,
                mustChangePassword: user.mustChangePassword,
                lastLoginAt: user.lastLoginAt,
                profile
            }
        });
    }
    catch (err) {
        console.log("Login error: ", err);
        res.status(500).json({
            message: "Server error during login"
        });
    }
}

// Change password
exports.changePassword = async (req, res) => {

    try {
        const employeeCode = req.user.employeeCode;

        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = req.body;

        const user = await User.findOne({
            employeeCode
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found!!"
            });
        }

        const isMatch = Boolean(await bcrypt.compare(currentPassword, user.passwordHash));
        if (!isMatch) {
            return res.status(401).json({
                message: "Current password is incorrect"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match!!"
            });
        }

        const samePassword = Boolean(await bcrypt.compare(newPassword, user.passwordHash));
        if (samePassword) {
            return res.status(400).json({
                message: "New password cannot be the same as current password"
            })
        }

        const newPassHash = await bcrypt.hash(newPassword, 10);

        user.passwordHash = newPassHash;
        user.mustChangePassword = false;

        await user.save();

        res.status(200).json({
            message: "Password changed successfully"
        });

    }
    catch (err) {
        console.error("Error during password change: ", err);
        return res.status(500).json({
            message: "Server error during password change"
        });
    }
}

// Forgot Password
exports.forgotPassword = async (req, res) => {
    
    try {
        const { email } = req.body;

        const user = await User.findOne({
            email
        });

        if (
            !user ||
            String(user.status) !== "ACTIVE"
        ) {
            return res.status(200).json({
                message:
                    "If the email exists, a reset link has been sent"
            });
        }

        const resetPasswordToken = crypto.randomBytes(32).toString("hex");
        const resetPasswordTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

        const resetPasswordTokenHash =
            crypto
                .createHash("sha256")
                .update(resetPasswordToken)
                .digest("hex");

        user.resetPasswordTokenHash = resetPasswordTokenHash;
        user.resetPasswordTokenExpiry = resetPasswordTokenExpiry;

        await user.save();

        // Send email with reset token
        try {
            await sendEmail({
                to: user.email,

                subject: "HMS Password Reset Request",

                html: `
                  <h2>HMS Password Reset</h2>
        
                  <p>
                    Use the link below to reset your password.
                  </p>
        
                  <p>
                    <a href="http://localhost:4200/reset-password?token=${resetPasswordToken}">
                      Reset Password
                    </a>
                  </p>

                  <p>This reset link expires in 15 minutes.</p>

                  <p>If you did not request this, ignore this email.</p>
        
                  <p>
                    Regards,
                    <br />
                    HMS Team
                  </p>
                `,
            });
        } catch (emailError) {
            console.error("Email sending error:", emailError);
        }

        res.status(200).json({
            message: "If the email exists, a reset link has been sent."
        });

    }
    catch (err) {
        console.error("Error during forgot password: ", err);
        return res.status(500).json({
            message: "Server error during forgot password"
        });
    }
}

// Reset password
exports.resetPassword = async (req, res) => {

    try {
        const {
            resetToken,
            newPassword,
            confirmPassword
        } = req.body;

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match!!"
            });
        }

        const hashedToken =
            crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");

        const user = await User.findOne({
            resetPasswordTokenHash: hashedToken,
            resetPasswordTokenExpiry: {
                $gt: new Date()
            }
        });

        if (!user){
            return res.status(400).json({
                message: "Invalid or expired token"
            });
        }

        if (String(user.status) !== "ACTIVE"){
            return res.status(400).json({
                message: "Invalid or expired token"
            })
        }

        const isSamePassword = Boolean(await bcrypt.compare(newPassword, user.passwordHash));
        if (isSamePassword){
            return res.status(400).json({
                message: "New password cannot be the same as current password"
            });
        }

        const newHash = await bcrypt.hash(newPassword, 10);

        user.passwordHash = newHash;

        user.resetPasswordTokenHash = null;
        user.resetPasswordTokenExpiry = null;
        user.mustChangePassword = false;

        await user.save();

        res.status(200).json({
            message: "Password reset successful"
        })

    }
    catch (err) {
        console.error("Error during reset password: ", err);
        res.status(500).json({
            message: "Server error during reset password"
        });
    }
}

// Logout
exports.logout = (req, res) => {
    res.status(200).json({
        message: "User has been logged out successfuly"
    });
}