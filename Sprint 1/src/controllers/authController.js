const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/Users");
const Employee = require("../models/Employees");
const buildEmployeeData = require("../utils/buildEmployeeData");
const validateUniqueEmployeeFields = require("../validators/validateUniqueEmployeeFields");
const getCurrentUser = require("../utils/getCurrentUser");
const sendEmail = require("../utils/sendEmail");
const emailTemplates = require("../utils/emailTemplates");
const { DESIGNATION_ROLE_MAP } = require("../config/constants");
require("dotenv").config();

// Self register employee account
exports.register = async (req, res) => {
    const { username, email, password, designation } = req.body;

    try {
        const uniquenessResult = await validateUniqueEmployeeFields(req.body);
        if (!uniquenessResult.success) {
            return res.status(uniquenessResult.status).json({
                message: uniquenessResult.message
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const employeeData = buildEmployeeData(req.body);

        const employee = new Employee(employeeData);
        await employee.save();

        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const role = DESIGNATION_ROLE_MAP[designation] ?? "STAFF";

        const user = new User({
            username,
            email,
            passwordHash,
            roles: [role],
            employeeCode: employee.employeeCode,
            status: "ACTIVE",
            isVerified: false,
            verificationToken,
            verificationTokenExpiry
        });

        await user.save();

        let frontendUrl = process.env.FRONTEND_URL || "http://localhost:4200";
        while (frontendUrl.endsWith("/")) frontendUrl = frontendUrl.slice(0, -1);
        const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

        try {
            await sendEmail({
                to: email,
                ...emailTemplates.accountRegistered({ verifyUrl })
            });
        } catch (emailError) {
            console.error("Registration email error:", emailError);
        }

        return res.status(201).json({
            message: "Registration successful. Please check your email to verify your account.",
            user: {
                username: user.username,
                email: user.email,
                roles: user.roles
            },
            employee: {
                employeeCode: employee.employeeCode,
                name: employee.name,
                department: employee.department,
                designation: employee.designation
            }
        });
    } catch (err) {
        console.error("Employee registration error:", err);
        return res.status(500).json({
            message: "Server error during employee registration"
        });
    }
};

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

        if (!user.isVerified) {
            return res.status(403).json({ 
                message: "Please verify your email before logging in" 
            });
        }

        if (String(user.status) !== "ACTIVE") {
            return res.status(403).json({ 
                message: "Account is inactive" 
            });
        }

        user.lastLoginAt = new Date();
        await user.save();

        const employee = await Employee.findOne({ employeeCode: user.employeeCode }).select("-__v");
        if (!employee) {
            return res.status(404).json({ 
                message: "Employee profile not found" 
            });
        }

        const token = jwt.sign(
            { employeeCode: user.employeeCode, roles: user.roles },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                employeeCode: user.employeeCode,
                username: user.username,
                email: user.email,
                roles: user.roles,
                lastLoginAt: user.lastLoginAt
            }
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ 
            message: err.message 
        });
    }
};

// Verify email using the token sent during registration
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ 
                message: "Verification token is required" 
            });
        }

        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpiry: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ 
                message: "Invalid or expired verification token" 
            });
        }

        if (user.isVerified) {
            return res.status(200).json({ 
                message: "Email already verified. You can log in." 
            });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiry = undefined;
        await user.save();

        res.status(200).json({ 
            message: "Email verified successfully. You can now log in." 
        });
    } catch (err) {
        console.error("Verify email error:", err);
        res.status(500).json({ 
            message: err.message 
        });
    }
};

exports.me = async (req, res) => {
    try {
        return await getCurrentUser(req.user.employeeCode, res);
    } catch (err) {
        console.error("Error during me:", err);
        return res.status(500).json({ 
            message: "Server error while fetching current user" 
        });
    }
};