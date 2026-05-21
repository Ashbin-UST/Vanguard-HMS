const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/Users");
const Employee = require("../models/Employees");
const sendEmail = require("../utils/sendEmail");
const generateTemporaryPassword = require("../utils/generateTemporaryPassword");
const buildEmployeeData = require("../utils/buildEmployeeData");
const buildEmployeeResponse = require("../utils/buildEmployeeResponse");
const updateEmployeeData = require("../utils/updateEmployeeData");
const validateUniqueEmployeeFields = require("../utils/validateUniqueEmployeeFields");

const restrictedDesignations = new Set(["OWNER", "ADMIN"]);

// Employee Account Creation
exports.createEmployee = async (req, res) => {
  let employee;
  let user;
  let temporaryPassword;

  const { username, email, designation } = req.body;

  try {
    // Prevent admin from creating ADMIN or OWNER accounts
    if (restrictedDesignations.has(designation)) {
      return res.status(403).json({
        message: "Invalid designation. Cannot create admin or owner accounts.",
      });
    }

    const uniquenessResult = await validateUniqueEmployeeFields(req.body);

    if (!uniquenessResult.success) {
      return res.status(uniquenessResult.status).json({
        message: uniquenessResult.message,
      });
    }

    // Generate temporary password
    temporaryPassword = generateTemporaryPassword();

    // Hash password
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

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
      status: "ACTIVE",
      mustChangePassword: true,
      createdByAdmin: true,
      approvedBy: req.user.employeeCode,
      approvedAt: new Date(),
      createdBy: req.user.employeeCode,
    });

    await user.save();

    // Send email AFTER successful transaction
    try {
      await sendEmail({
        to: user.email,

        subject: "HMS Employee Account Created",

        html: `
          <h2>Welcome to HMS</h2>

          <p>
            Your employee account has been created successfully.
          </p>

          <p>
            <strong>Username:</strong>
            ${username}
          </p>

          <p>
            <strong>Temporary Password:</strong>
            ${temporaryPassword}
          </p>

          <p>
            Please login using the link below and change your password immediately.
          </p>

          <p>
            <a href="http://localhost:4200">
              Login to HMS
            </a>
          </p>

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

    return res.status(201).json({
      message: "Employee account created successfully. Login credentials have been sent via email.",
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
    console.error("Employee creation error:", err);
    return res.status(500).json({
      message: "Server error during employee creation",
    });
  }
};

// Get all staff employees
exports.getEmployees = async (req, res) => {
  try {
    // Find all STAFF users
    const users = await User.find({
      roles: "STAFF",
    }).select("-passwordHash");

    // Extract employee codes
    const employeeCodes = users.map((user) => user.employeeCode);

    // Find matching employees
    const employees = await Employee.find({
      employeeCode: {
        $in: employeeCodes,
      },
    });

    const formattedEmployees = buildEmployeeResponse(employees, users);

    return res.status(200).json({
      totalEmployees: formattedEmployees.length,
      employees: formattedEmployees,
    });
  } catch (err) {
    console.error("Get employees error:", err);

    return res.status(500).json({
      message: "Server error while fetching employees",
    });
  }
};

// Get account status pending
exports.getPendingEmployees = async (req, res) => {
  try {
    // Find all STAFF users
    const users = await User.find({
      roles: "STAFF",
      status: "PENDING",
    }).select("-passwordHash");

    // Extract employee codes
    const employeeCodes = users.map((user) => user.employeeCode);

    // Find matching employees
    const employees = await Employee.find({
      employeeCode: {
        $in: employeeCodes,
      },
    });

    const formattedEmployees = buildEmployeeResponse(employees, users);

    return res.status(200).json({
      totalEmployees: formattedEmployees.length,
      employees: formattedEmployees,
    });
  } catch (err) {
    console.error("Get employees error:", err);

    return res.status(500).json({
      message: "Server error while fetching employees",
    });
  }
};

// Approve pending employee request
exports.approveEmployee = async (req, res) => {
  try {
    // Get employeecode
    const employeeCode = req.params.employeeCode;

    // Find user in db
    const user = await User.findOne({
      employeeCode,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found!!",
      });
    }

    // Ensure role is staff
    if (user.roles.some((role) => restrictedDesignations.has(role))) {
      return res.status(403).json({
        message: "Only STAFF accounts can be approved",
      });
    }

    //Ensure current status as pending
    if (String(user.status) !== "PENDING") {
      return res.status(400).json({
        message: "Account status is not pending",
      });
    }

    user.status = "ACTIVE";
    user.approvedBy = req.user.employeeCode;
    user.approvedAt = new Date();

    await user.save();

    // Send email AFTER approval
    try {
      await sendEmail({
        to: user.email,

        subject: "HMS Employee Account Approved",

        html: `
          <h2>Welcome to HMS</h2>

          <p>
            Your employee account has been approved. You can login to HMS.
          </p>

          <p>
            <a href="http://localhost:4200">
              Login to HMS
            </a>
          </p>

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
      message: "Employee account approved successfully",
      user: {
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Error during approval: ", err);
    return res.status(500).json({
      message: "Server error during approval",
    });
  }
};

// Reject pending employee request
exports.rejectEmployee = async (req, res) => {
  try {
    // Get employeecode
    const employeeCode = req.params.employeeCode;

    // Find user in db
    const user = await User.findOne({
      employeeCode,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found!!",
      });
    }

    // Ensure role is staff
    if (user.roles.some((role) => restrictedDesignations.has(role))) {
      return res.status(403).json({
        message: "Only STAFF accounts can be rejected",
      });
    }

    //Ensure current status as pending
    if (String(user.status) !== "PENDING") {
      return res.status(400).json({
        message: "Account status is not pending",
      });
    }

    user.status = "REJECTED";

    await user.save();

    // Send email AFTER rejection
    try {
      await sendEmail({
        to: user.email,

        subject: "HMS Employee Account Registration Rejected",

        html: `
          <h2>HMS Registration Request Rejected</h2>

          <p>
            Your registration has been rejected. Please contact the administrator/support team for more details.
          </p>

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
      message: "Employee registration request rejected successfully",
      user: {
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Error during rejection: ", err);
    return res.status(500).json({
      message: "Server error during rejection",
    });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const { employeeCode } = req.params;

    // Find employee
    const employee = await Employee.findOne({
      employeeCode,
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    // Prevent updating OWNER or ADMIN
    if (restrictedDesignations.has(employee.designation)) {
      return res.status(403).json({
        message: "Cannot update OWNER or ADMIN accounts",
      });
    }

    updateEmployeeData(employee, req.body);

    // Save employee
    await employee.save();

    return res.status(200).json({
      message: "Employee updated successfully",
      employee: {
        employeeCode: employee.employeeCode,
        name: employee.name,
        department: employee.department,
        designation: employee.designation,
      },
    });
  } catch (err) {
    console.error("Error during employee update:", err);
    return res.status(500).json({
      message: "Server error during employee update",
    });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const employeeCode = req.params.employeeCode;

    // Find employee
    const employee = await Employee.findOne({
      employeeCode,
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    // Prevent deleting OWNER or ADMIN
    if (restrictedDesignations.has(employee.designation)) {
      return res.status(403).json({
        message: "Cannot delete OWNER or ADMIN accounts",
      });
    }

    // Delete employee
    await Employee.deleteOne(
      {
        employeeCode,
      },
      {
        session,
      },
    );

    // Delete user
    await User.deleteOne(
      {
        employeeCode,
      },
      {
        session,
      },
    );

    return res.status(200).json({
      message: "Employee deleted successfully",
    });
  } catch (err) {
    console.error("Error during employee deletion:", err);
    return res.status(500).json({
      message: "Server error during employee deletion",
    });
  }
};
