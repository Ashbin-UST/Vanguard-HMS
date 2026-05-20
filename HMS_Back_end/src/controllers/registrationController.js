const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/Users");
const Employee = require("../models/Employees");
const sendEmail = require("../utils/sendEmail");
const buildEmployeeData = require("../utils/buildEmployeeData");
const validateUniqueEmployeeFields = require("../utils/validateUniqueEmployeeFields");

// Employee self registration
exports.registerEmployee = async (req, res) => {
  let employee;
  let user;

  const {
    username,
    email,
    password,
    designation
  } = req.body;

  try {
    // Prevent self-registration as ADMIN or OWNER
    if (["ADMIN", "OWNER"].includes(designation)) {
      return res.status(403).json({
        message: "Invalid designation. Cannot create admin or owner accounts.",
      });
    }

    const uniquenessResult = await validateUniqueEmployeeFields(req.body);

    if (!uniquenessResult.success){
      return res.status(uniquenessResult.status).json({
        message: uniquenessResult.message
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Build employee data
    const employeeData = buildEmployeeData(req.body);

      // Create employee
      employee = new Employee(employeeData);

      await employee.save();

      // Create user
      user = new User({
        username,
        email,
        passwordHash,
        roles: ["STAFF"],
        employeeCode: employee.employeeCode,
        status: "PENDING",
        mustChangePassword: false,
        createdByAdmin: false,
        approvedBy: null,
        approvedAt: null,
        createdBy: null,
      });

      await user.save();

    // Send approval request email to admin(s)
    try {
      // Find all admin users
      const admins = await User.find({
        roles: "ADMIN",
        status: "ACTIVE",
      });

      // Extract admin emails
      const adminEmails = admins.map((admin) => admin.email);
      // Send email to all admins

      await sendEmail({
        to: adminEmails,

        subject: "New Employee Registration Request",

        html: `
            <h2>New Employee Registration Request</h2>

            <p>
                A new employee has submitted a registration request and is awaiting approval.
            </p>

            <p>
                <strong>Name:</strong>
                ${employee.name}
            </p>

            <p>
                <strong>Employee Code:</strong>
                ${employee.employeeCode}
            </p>

            <p>
                <strong>Department:</strong>
                ${employee.department}
            </p>

            <p>
                <strong>Designation:</strong>
                ${employee.designation}
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
        `,
      });
    } catch (emailError) {
      console.error("Admin notification email error:", emailError);
    }

    return res.status(201).json({
      message: "Registration request successful. Wait for admin approval.",

      user: {
        username: user.username,
        email: user.email,
        roles: user.roles,
      },

      employee: {
        employeeCode: employee.employeeCode,
        name: employee.name,
        department: employee.department,
        designation: employee.designation,
      },
    });
  } catch (err) {
    console.error("Employee self registration error:", err);

    return res.status(500).json({
      message: "Server error during employee self registration",
    });
  }
}