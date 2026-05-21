const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Employee = require("../models/Employees");
const User = require("../models/Users");
const sendEmail = require("../utils/sendEmail");
const generateTemporaryPassword = require("../utils/generateTemporaryPassword");
const buildEmployeeData = require("../utils/buildEmployeeData");
const buildEmployeeProfile = require("../utils/buildEmployeeProfile");
const buildEmployeeResponse = require("../utils/buildEmployeeResponse");
const validateUniqueEmployeeFields = require("../utils/validateUniqueEmployeeFields");

// Create Admin
const createAdmin = async (req, res) => {
  let employee;
  let user;
  let temporaryPassword;

  const { username, email } = req.body;

  try {
    const uniquenessResult = await validateUniqueEmployeeFields(req.body);

    if (!uniquenessResult.success) {
      return res.status(uniquenessResult.status).json({
        message: uniquenessResult.message,
      });
    }

    // Generate temporary password
    temporaryPassword = generateTemporaryPassword();

    // Hash password
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Build Admin Employee Data
    const employeeData = buildEmployeeData(req.body);

      // Create employee
      employee = new Employee(employeeData);
      await employee.save();

      // Create user
      user = new User({
        username,
        email,
        passwordHash: hashedPassword,
        status: "ACTIVE",
        roles: ["ADMIN"],
        employeeCode: employee.employeeCode,
        mustChangePassword: true,
        createdByAdmin: true,
        approvedBy: req.user.employeeCode,
        approvedAt: new Date(),
        createdBy: req.user.employeeCode,
      });
      await user.save();

    // Send email
    try {
      await sendEmail({
        to: user.email,

        subject: "HMS Admin Account Created",

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

                <p> Please login using the link below and change your password immediately. </p>

                <p> <a href="http://localhost:4200"> Login to HMS </a> </p>

                <p> Regards, <br /> HMS Team </p>
            `,
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
    }

    return res.status(201).json({
      message:
        "Admin account created successfully. Credentials sent via email.",

      employee: {
        employeeCode: employee.employeeCode,
        name: employee.name,
        email: employee.email,
        designation: employee.designation,
      },

      user: {
        username: user.username,
        roles: user.roles,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("Error during admin creation: ", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get all Admins
const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({
      roles: "ADMIN",
    }).select("-passwordHash");

    const employeeCodes = admins.map((admin) => admin.employeeCode);

    const employees = await Employee.find({
      employeeCode: {
        $in: employeeCodes,
      },
    });

    const formattedAdmins = buildEmployeeResponse(employees, admins);

    return res.status(200).json({
      totalAdmins: formattedAdmins.length,
      admins: formattedAdmins,
    });
  } catch (err) {
    console.error("Error during admin retrieval: ",err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Update Admin
const updateAdmin = async (req, res) => {
  try {
    const { employeeCode } = req.params;

    // Find admin employee
    const employee = await Employee.findOne({
      employeeCode,
    });

    if (!employee) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    updateEmployeeData(employee, req.body);

    // Save employee
    await employee.save();

    return res.status(200).json({
      message: "Admin updated successfully",
      employee: {
        employeeCode: employee.employeeCode,
        name: employee.name,
        department: employee.department,
        designation: employee.designation,
      },
    });
  } catch (err) {
    console.error("Error during admin update:", err);
    return res.status(500).json({
      message: "Server error during admin update",
    });
  }
};

// Delete Admin
const deleteAdmin = async (req, res) => {
  try {
    const { employeeCode } = req.params;

    const employee = await Employee.findOne({
      employeeCode,
    });

    if (!employee) {
      return res.status(404).json({
        message: "Admin not found",
      });
    }

    // Prevent owner deletion
    if (employee.designation === "OWNER") {
      return res.status(403).json({
        message: "Owner account cannot be deleted",
      });
    }

    // Delete user
    await User.findOneAndDelete({
      employeeCode,
    });

    // Delete employee
    await Employee.findOneAndDelete({
      employeeCode,
    });

    return res.status(200).json({
      message: "Admin deleted successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  createAdmin,
  getAdmins,
  updateAdmin,
  deleteAdmin,
};
