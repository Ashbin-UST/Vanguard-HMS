const User = require("../models/Users");
const Employee = require("../models/Employees");
const emailTemplates = require("../utils/emailTemplates");
const sendEmail = require("../utils/sendEmail");
const createAccountWithEmployee = require("../utils/createAccountWithEmployee");
const { RESTRICTED_ROLES_SET } = require("../config/constants");

// Create a new STAFF employee account with a temporary password
exports.createEmployee = async (req, res) => {
  const { designation } = req.body;

  try {
    if (RESTRICTED_ROLES_SET.has(designation)) {
      return res.status(403).json({
        message: "Invalid designation. Cannot create admin or owner accounts.",
      });
    }

    const { employee, user } = await createAccountWithEmployee(req, { // NOSONAR: false positive; function is async but Sonar loses type info across CommonJS require
      roles: ["STAFF"],
      emailTemplate: emailTemplates.employeeCredentials,
    });

    return res.status(201).json({
      message:
        "Employee account created successfully. Login credentials have been sent via email.",
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
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error("Employee creation error:", err);
    return res.status(500).json({
      message: "Server error during employee creation",
    });
  }
};

// Approve a self-registered employee
exports.approveEmployee = async (req, res) => {
  try {
    const employeeCode = req.params.employeeCode;

    const user = await User.findOne({ employeeCode });

    if (!user) {
      return res.status(404).json({
        message: "User not found!!",
      });
    }

    if (user.roles.some((role) => RESTRICTED_ROLES_SET.has(role))) {
      return res.status(403).json({
        message: "Only STAFF accounts can be approved",
      });
    }

    if (String(user.status) !== "PENDING") {
      return res.status(400).json({
        message: "Account status is not pending",
      });
    }

    user.status = "ACTIVE";
    user.approvedBy = req.user.employeeCode;
    user.approvedAt = new Date();

    await user.save();

    // Notify the employee that their account has been approved
    try {
      await sendEmail({
        to: user.email,
        ...emailTemplates.accountApproved(),
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
    }

    return res.status(200).json({
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

// Reject a self-registration request
exports.rejectEmployee = async (req, res) => {
  try {
    const employeeCode = req.params.employeeCode;

    const user = await User.findOne({ employeeCode });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.roles.some((role) => RESTRICTED_ROLES_SET.has(role))) {
      return res.status(403).json({
        message: "Only STAFF accounts can be rejected",
      });
    }

    if (String(user.status) !== "PENDING") {
      return res.status(400).json({
        message: "Account status is not pending",
      });
    }

    // Email before deletion so the address is still reachable
    try {
      await sendEmail({
        to: user.email,
        ...emailTemplates.accountRejected(),
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
    }

    await Promise.all([
      Employee.deleteOne({ employeeCode }),
      User.deleteOne({ employeeCode }),
    ]);

    return res.status(200).json({
      message: "Employee registration request rejected successfully",
    });
  } catch (err) {
    console.error("Error during rejection:", err);
    return res.status(500).json({
      message: "Server error during rejection",
    });
  }
};