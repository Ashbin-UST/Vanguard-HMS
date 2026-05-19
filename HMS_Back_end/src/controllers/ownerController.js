const bcrypt = require("bcryptjs");

const Employee = require("../models/Employee");
const User = require("../models/User");

const sendEmail = require("../utils/sendEmail");
const generateTemporaryPassword = require("../utils/generateTemporaryPassword");

const createAdmin = async (req, res) => {

    try {

        const {
            username,
            name,
            phone,
            email,
            department,
            designation,
            joiningDate,
            qualification
        } = req.body;

        // Check existing username

        const existingUsername =
            await User.findOne({
                username
            });

        if (existingUsername) {

            return res.status(409).json({
                message:
                    "Username already exists"
            });
        }

        // Check existing user email

        const existingUserEmail =
            await User.findOne({
                email
            });

        if (existingUserEmail) {

            return res.status(409).json({
                message:
                    "Email already exists"
            });
        }

        // Check existing employee email

        const existingEmployeeEmail =
            await Employee.findOne({
                email
            });

        if (existingEmployeeEmail) {

            return res.status(409).json({
                message:
                    "Employee email already exists"
            });
        }

        // Generate temporary password

        const temporaryPassword =
            generateTemporaryPassword();

        // Hash password

        const hashedPassword =
            await bcrypt.hash(
                temporaryPassword,
                10
            );

        // Create employee

        const employee =
            await Employee.create({

                name,

                phone,

                email,

                department,

                designation,

                joiningDate,

                qualification
            });

        // Create user

        const user =
            await User.create({

                username,

                email,

                passwordHash:
                    hashedPassword,

                status:
                    "ACTIVE",

                roles:
                    ["ADMIN"],

                employeeCode:
                    employee.employeeCode,

                mustChangePassword:
                    true,

                createdByAdmin:
                    true,

                approvedBy:
                    req.user.employeeCode,

                approvedAt:
                    new Date(),

                createdBy:
                    req.user.employeeCode
            });

        // Send email

        await sendEmail({

            to: user.email,

            subject:
                "HMS Admin Account Created",

            html: `
                <h2>Welcome to HMS</h2>

                <p>Your admin account has been created successfully.</p>

                <p>
                    <strong>Username:</strong>
                    ${username}
                </p>

                <p>
                    <strong>Temporary Password:</strong>
                    ${temporaryPassword}
                </p>

                <p>
                    Please login and change your password immediately.
                </p>
            `
        });

        return res.status(201).json({

            message:
                "Admin account created successfully. Credentials sent via email.",

            employee: {

                employeeCode:
                    employee.employeeCode,

                name:
                    employee.name,

                email:
                    employee.email,

                designation:
                    employee.designation
            },

            user: {

                username:
                    user.username,

                roles:
                    user.roles,

                status:
                    user.status
            }
        });
    }
    catch (err) {

        console.error(err);

        return res.status(500).json({
            message:
                "Internal server error"
        });
    }
};

const getAdmins = async (req, res) => {

    try {

        const admins =
            await User.find({

                roles: "ADMIN"
            })
            .select("-passwordHash");

        return res.status(200).json({
            admins
        });
    }
    catch (err) {

        console.error(err);

        return res.status(500).json({
            message:
                "Internal server error"
        });
    }
};

const updateAdmin = async (req, res) => {

    try {

        const {
            employeeCode
        } = req.params;

        const updatedEmployee =
            await Employee.findOneAndUpdate(

                {
                    employeeCode
                },

                req.body,

                {
                    new: true
                }
            );

        if (!updatedEmployee) {

            return res.status(404).json({
                message:
                    "Admin not found"
            });
        }

        return res.status(200).json({

            message:
                "Admin updated successfully",

            employee:
                updatedEmployee
        });
    }
    catch (err) {

        console.error(err);

        return res.status(500).json({
            message:
                "Internal server error"
        });
    }
};

const deleteAdmin = async (req, res) => {

    try {

        const {
            employeeCode
        } = req.params;

        const employee =
            await Employee.findOne({
                employeeCode
            });

        if (!employee) {

            return res.status(404).json({
                message:
                    "Admin not found"
            });
        }

        // Prevent owner deletion

        if (
            employee.designation === "OWNER"
        ) {

            return res.status(403).json({
                message:
                    "Owner account cannot be deleted"
            });
        }

        // Delete user

        await User.findOneAndDelete({
            employeeCode
        });

        // Delete employee

        await Employee.findOneAndDelete({
            employeeCode
        });

        return res.status(200).json({
            message:
                "Admin deleted successfully"
        });
    }
    catch (err) {

        console.error(err);

        return res.status(500).json({
            message:
                "Internal server error"
        });
    }
};

module.exports = {

    createAdmin,

    getAdmins,

    updateAdmin,

    deleteAdmin
};