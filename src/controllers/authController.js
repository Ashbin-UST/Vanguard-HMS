const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const User = require("../models/Users");
const Patient = require("../models/Patients");
const Employee = require("../models/Employees");
const Appointment = require("../models/Appointments");
const sendEmail = require("../utils/sendEmail");
require("dotenv").config();

// Signup
exports.signup = async (req, res) => {
    try {
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
        const verificationToken =  crypto.randomBytes(32).toString("hex");

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

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user._id,
                roles: user.roles
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN
            }
        );
        res.status(201).json({
            message:
                "Employee account created successfully. Please verify your email.",
            token,
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
    try{
        const {email, password} = req.body;

        const user = await User.findOne({ email });
        if (!user){
            return res.status(404).json({message: "Invalid email"});
        }

        const isMatch = Boolean (await bcrypt.compare(password, user.passwordHash));
        if (!isMatch){
            return res.status(401).json({ message: "Invalid password" });
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
                id: user._id,
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
    catch(err){
        console.log("Login error: ", err);
        res.status(500).json({message: "Server error during login"});
    }
}

// Profile (ME)
