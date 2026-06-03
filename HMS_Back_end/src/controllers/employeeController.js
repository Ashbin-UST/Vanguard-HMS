const User = require("../models/Users");
const Employee = require("../models/Employees");
const ProfileChangeRequest = require("../models/ProfileChangeRequests");
const buildEmployeeProfile = require("../utils/buildEmployeeProfile");
const sendEmail = require("../utils/sendEmail");
const recordAudit = require("../utils/recordAudit");
const resolveActor = require("../utils/resolveActor");

// Fields an employee is allowed to self-update (via approval flow)
const SELF_EDITABLE_FIELDS = ["phone", "qualification"];

// Get current logged in user's profile
exports.getProfile = async (req, res) => {

    try {
        const employee = await Employee.findOne({
            employeeCode: req.user.employeeCode
        }).select("-__v");

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found!!"
            });
        }

        const profile = buildEmployeeProfile(employee);

        res.status(200).json({
            message: "Profile retrieved successfully",
            profile
        });
    }
    catch (err) {
        console.error("Error during profile retrieval: ", err);
        res.status(500).json({
            message: "Server error during profile retrieval"
        });
    }
};

// Get current authenticated user + profile (used after a page refresh)
exports.getMe = async (req, res) => {

    try {
        const user = await User.findOne({
            employeeCode: req.user.employeeCode
        }).select("-passwordHash -resetPasswordTokenHash -resetPasswordTokenExpiry -__v");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const employee = await Employee.findOne({
            employeeCode: user.employeeCode
        }).select("-__v");

        if (!employee) {
            return res.status(404).json({
                message: "Employee profile not found"
            });
        }

        const profile = buildEmployeeProfile(employee);
        return res.status(200).json({
            message: "User retrieved successfully",
            user: {    
                employeeCode: user.employeeCode,
                email: user.email,
                roles: user.roles,
                mustChangePassword: user.mustChangePassword,
                lastLoginAt: user.lastLoginAt,
                profile
            }
        });
    }
    catch (err) {
        console.error("Error during getMe: ", err);
        return res.status(500).json({
            message: "Server error while fetching current user"
        });
    }
};

// Get all active doctors (for appointment booking dropdown)
exports.getDoctors = async (req, res) => {

    try {
        // Active doctor users
        const users = await User.find({
            status: "ACTIVE"
        }).select("employeeCode");

        const activeCodes = users.map((u) => u.employeeCode);

        const doctors = await Employee.find({
            designation: "DOCTOR",
            employeeCode: { $in: activeCodes }
        }).select(
            "employeeCode name specialization department consultationFee availabilitySlots qualification"
        );

        return res.status(200).json({
            message: "Doctors retrieved successfully",
            total: doctors.length,
            doctors
        });
    }
    catch (err) {
        console.error("Error during doctors retrieval: ", err);
        return res.status(500).json({
            message: "Server error while fetching doctors"
        });
    }
};

// Submit a profile change request (requires admin approval)
exports.requestProfileUpdate = async (req, res) => {

    try {
        const employee = await Employee.findOne({
            employeeCode: req.user.employeeCode
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        // Build the diff of requested changes for allowed fields only
        const requestedChanges = {};

        SELF_EDITABLE_FIELDS.forEach((field) => {
            if (req.body[field] === undefined) {
                return;
            }

            const oldValue = employee[field];
            const newValue = req.body[field];

            // Normalize arrays/values for comparison
            const isDifferent =
                JSON.stringify(oldValue) !== JSON.stringify(newValue);

            if (isDifferent) {
                requestedChanges[field] = {
                    old:
                        Array.isArray(oldValue) || oldValue === undefined
                            ? oldValue
                            : oldValue,
                    new: newValue
                };
            }
        });

        if (Object.keys(requestedChanges).length === 0) {
            return res.status(400).json({
                message: "No valid changes were requested"
            });
        }

        // Prevent duplicate pending requests
        const existingPending = await ProfileChangeRequest.findOne({
            employeeCode: employee.employeeCode,
            status: "PENDING"
        });

        if (existingPending) {
            return res.status(409).json({
                message:
                    "You already have a pending profile change request awaiting approval"
            });
        }

        const request = await ProfileChangeRequest.create({
            employeeCode: employee.employeeCode,
            employeeName: employee.name,
            email: employee.email,
            requestedChanges
        });

        // Notify admins
        try {
            const admins = await User.find({
                roles: "ADMIN",
                status: "ACTIVE"
            }).select("email");

            const adminEmails = admins.map((a) => a.email);

            if (adminEmails.length) {
                await sendEmail({
                    to: adminEmails.join(","),
                    subject: "Employee Profile Change Request",
                    html: `
                        <h2>Profile Change Request</h2>
                        <p>
                            ${employee.name} (${employee.employeeCode})
                            has requested changes to their profile and is awaiting approval.
                        </p>
                        <p>
                            Please review the request from the admin dashboard.
                        </p>
                        <p>
                            <a href="http://localhost:4200/dashboard">
                                Open Admin Dashboard
                            </a>
                        </p>
                        <p>
                            Regards,
                            <br />
                            HMS System
                        </p>
                    `
                });
            }
        } catch (emailError) {
            console.error("Admin notification email error:", emailError);
        }

        // Record audit
        const actor = await resolveActor(req.user);
        await recordAudit({
            actor,
            action: "PROFILE_CHANGE_REQUESTED",
            targetType: "PROFILE_CHANGE_REQUEST",
            targetId: request.requestId,
            message: `${employee.name} (${employee.employeeCode}) requested a profile change`
        });

        return res.status(201).json({
            message:
                "Your profile change request has been submitted for approval",
            request: {
                requestId: request.requestId,
                status: request.status,
                requestedChanges
            }
        });
    }
    catch (err) {
        console.error("Error during profile update request: ", err);
        return res.status(500).json({
            message: "Server error during profile update request"
        });
    }
};
