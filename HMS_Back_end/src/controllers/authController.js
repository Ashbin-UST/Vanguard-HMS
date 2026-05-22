const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const User = require("../models/Users");
const Employee = require("../models/Employees");
const sendEmail = require("../utils/sendEmail");
const createAuditLog = require("../utils/createAuditLog");
require("dotenv").config();

// Signup
exports.signup = async (req, res) => {
    try {
        console.log("Signup request body:", req.body);
        const {
            username,
            email,
            password,
            roles,
            name,
            phone,
            department,
            designation,
            joiningDate,
            medicalRegistrationNumber,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots
        } = req.body;
        
        // Check existing user
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create employee
        const employeeData = {
            name,
            phone,
            email,
            department,
            designation,
            joiningDate,
            qualification
        };

        // Add medical fields only for medical staff
        if (
            ["DOCTOR", "NURSE", "LAB_TECH", "PHARMACIST"].includes(designation)
        ) {
            employeeData.medicalRegistrationNumber = medicalRegistrationNumber;
        }

        // Add specialization only for doctors and lab technicians
        if (
            ["DOCTOR", "LAB_TECH"].includes(designation)
        ) {
            employeeData.specialization = specialization;
        }

        // Add consultation details only for doctors
        if (designation === "DOCTOR") {
            employeeData.consultationFee = consultationFee;
            employeeData.availabilitySlots = availabilitySlots;
        }

        // Create employee
        const employee = await Employee.create(employeeData);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString("hex");

        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Create user
        const user = await User.create({
            username,
            email,
            passwordHash,
            roles,
            employeeCode: employee.employeeCode,
            verificationToken,
            verificationTokenExpiry
        });
         const audit =await createAuditLog({
              req,
              action: "ADD",
              actor: req.user?.employeeCode || "System",
              actorRole: req.user?.roles || ["System"],
              collectionName: "Employees",
              targetId: employee._id,
              targetUserId: employee._id,
              before: employee,
                 // ✅ important
            });
            console.log(audit);

        // Verification URL
        const verifyUrl =
            `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

        // Send email
        await sendEmail({
            to: user.email,

            subject: "HMS - Verify Your Email",

            html: `
                <h2>Welcome to HMS</h2>
                <p>Hi ${employee.name}, your employee account has been created successfully.</p>
                <p>Please verify your email address using the link below:</p>
                <a href="${verifyUrl}" target="_blank">
                    Verify Email
                </a>
                <p>This verification link expires in <strong>24 hours</strong>.</p>
                <p>If you did not create this account, please ignore this email.</p>
            `
        });

        res.status(201).json({
            message:
                "Employee account created successfully. Please verify your email.",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                roles: user.roles,
                employeeCode: employee.employeeCode
            },
            employee
        });
    }
    catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({
            message: "Server error during signup"
        });
    }
}

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Login request body:", req.body);
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                message: "Invalid email"
            });
        }

        const isMatch = Boolean(await bcrypt.compare(password, user.passwordHash));
        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid password"
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                message: "Please verify your email before logging in"
            });
        }

        user.lastLoginAt = new Date();
        await user.save();

        const employee = await Employee.findOne({
            employeeCode: user.employeeCode
        }).select("-__v");

        let profile = {
            employeeCode: employee.employeeCode,
            name: employee.name,
            phone: employee.phone,
            email: employee.email,
            department: employee.department,
            designation: employee.designation,
            status: employee.status,
            joiningDate: employee.joiningDate,
            qualification: employee.qualification
        };

        // Add medical fields only for medical staff
        if (
            ["DOCTOR", "NURSE", "LAB_TECH", "PHARMACIST"]
                .includes(employee.designation)
        ) {
            profile.medicalRegistrationNumber = employee.medicalRegistrationNumber;
        }

        // Add specialization only for doctors and lab technicians
        if (
            ["DOCTOR", "LAB_TECH"].includes(employee.designation)
        ) {
            profile.specialization = employee.specialization;
        }

        // Add consultation details only for doctors
        if (employee.designation === "DOCTOR") {
            profile.consultationFee = employee.consultationFee;
            profile.availabilitySlots = employee.availabilitySlots;
        }

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

// Logout
exports.logout = (req, res) => {
    res.status(200).json({ message: "Logged out successfully" });
};

// Verify Email
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
            verificationTokenExpiry: {
                $gt: new Date()
            }
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid or expired verification token"
            });
        }

        if (user.isVerified) {
            return res.status(200).json({
                message: "Email already verified"
            });
        }

        user.isVerified = true;
        user.verificationToken = null;
        user.verificationTokenExpiry = null;

        await user.save();

        return res.status(200).json({
            message: "Email verified successfully"
        });

    }
    catch (err) {
        console.error("Verify email error:", err);
        return res.status(500).json({
            message: "Server error during email verification"
        });
    }
};

// User Profile
exports.profile = async (req, res) => {
    try {
        const user = await User.findOne({
            employeeCode: req.user.employeeCode
        }).select("-passwordHash -__v");
        if (!user) {
            return res.status(404).json({
                message: "User is not found!!"
            });
        }
        const employee = await Employee.findOne({
            employeeCode: req.user.employeeCode
        }).select("-email -__v");
        if (!employee) {
            return res.status(404).json({
                message: "Employee not found!!"
            });
        }
        res.status(200).json({
            user: {
                username: user.username,
                email: user.email,
                roles: user.roles,
                lastLoginAt: user.lastLoginAt,
                created_at: user.created_at
            },
            employee
        });
    }
    catch (err) {
        console.log("Error during view profile: ", err);
        res.status(500).json({
            message: "Server error during view profile"
        });
    }
}

// Self updation of employee profile
exports.updateMyProfile = async (req, res) => {
    try {
        const {
            phone,
            email,
            qualification
        } = req.body;

        const updateData = {};

        if (phone !== undefined) {
            updateData.phone = phone;
        }

        if (email !== undefined) {
            updateData.email = email;
        }

        if (qualification !== undefined) {
            updateData.qualification = qualification;
        }

        const updatedEmployee =
            await Employee.findOneAndUpdate(
                {
                    employeeCode: req.user.employeeCode
                },
                updateData,
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!updatedEmployee) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        // Update email in User collection also
        if (email !== undefined) {
            await User.findOneAndUpdate(
                {
                    employeeCode: req.user.employeeCode
                },
                {
                    email
                }
            );
        }

        res.status(200).json({
            message: "Employee profile updated successfully",
            updatedEmployee
        });

    }
    catch (err) {
        console.error("Error during updation:", err);
        res.status(500).json({
            message: "Server error during updation"
        });
    }
};

// Updation of employee by admin
exports.updateEmployee = async (req, res) => {
    try {
        const {
            phone,
            email,
            department,
            designation,
            status,
            qualification,
            consultationFee,
            availabilitySlots
        } = req.body;

        const updateData = {};

        if (phone !== undefined) {
            updateData.phone = phone;
        }

        if (email !== undefined) {
            updateData.email = email;
        }

        if (department !== undefined) {
            updateData.department = department;
        }

        if (designation !== undefined) {
            updateData.designation = designation;
        }

        if (status !== undefined) {
            updateData.status = status;
        }

        if (qualification !== undefined) {
            updateData.qualification = qualification;
        }

        // Doctor-only fields
        if (
            designation === "DOCTOR" ||
            designation === undefined
        ) {

            if (consultationFee !== undefined) {
                updateData.consultationFee = consultationFee;
            }

            if (availabilitySlots !== undefined) {
                updateData.availabilitySlots = availabilitySlots;
            }
        }

        const updatedEmployee =
            await Employee.findOneAndUpdate(
                {
                    employeeCode: req.params.employeeCode
                },
                updateData,
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!updatedEmployee) {

            return res.status(404).json({
                message: "Employee not found"
            });
        }

        // Update email in User collection also
        if (email !== undefined) {
            await User.findOneAndUpdate(
                {
                    employeeCode:
                        req.params.employeeCode
                },
                {
                    email
                }
            );
        }

        res.status(200).json({
            message: "Employee updated successfully",
            updatedEmployee
        });

    }
    catch (err) {
        console.error("Error during updation:", err);
        res.status(500).json({
            message: "Server error during updation"
        });
    }
};

// delete employee (only for admin)
exports.deleteEmployee = async (req, res) => {
    try {
        const { employeeCode } = req.params;

        const user = await User.findOne({
            employeeCode
        });

        if (!user) {
            return res.status(404).json({
                message: "User is not found!!"
            });
        }

        const employee = await Employee.findOne({
            employeeCode
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee is not found!!"
            });
        }

        await User.findOneAndDelete({
            employeeCode
        });

        await Employee.findOneAndDelete({
            employeeCode
        });

        res.status(200).json({
            message: "Employee Deletion successfull"
        });
    }
    catch (err) {
        console.error("Error during deletion: ", err);
        res.status(500).json({
            message: "Server error during deletion"
        });
    }
}