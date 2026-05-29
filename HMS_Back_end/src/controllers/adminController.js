const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/Users");
const Employee = require("../models/Employees");
const AuditLog = require("../models/AuditLogs");
const ProfileChangeRequest = require("../models/ProfileChangeRequests");
const sendEmail = require("../utils/sendEmail");
const generateTemporaryPassword = require("../utils/generateTemporaryPassword");
const buildEmployeeData = require("../utils/buildEmployeeData");
const buildEmployeeResponse = require("../utils/buildEmployeeResponse");
const updateEmployeeData = require("../utils/updateEmployeeData");
const validateUniqueEmployeeFields = require("../utils/validateUniqueEmployeeFields");
const recordAudit = require("../utils/recordAudit");
const resolveActor = require("../utils/resolveActor");

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

    // Record audit
    const actor = await resolveActor(req.user);
    await recordAudit({
      actor,
      action: "EMPLOYEE_CREATED",
      targetType: "EMPLOYEE",
      targetId: employee.employeeCode,
      message: `Employee ${employee.name} (${employee.employeeCode}) was created as ${employee.designation}`
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
    console.error("Employee creation error:", err);
    return res.status(500).json({
      message: "Server error during employee creation",
    });
  }
};

// Get all active staff employees
exports.getEmployees = async (req, res) => {
  try {
    // Find all ACTIVE STAFF users
    const users = await User.find({
      roles: "STAFF",
      status: "ACTIVE",
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

// Get employees having account status pending
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

    // Record audit
    const actor = await resolveActor(req.user);
    await recordAudit({
      actor,
      action: "EMPLOYEE_APPROVED",
      targetType: "EMPLOYEE",
      targetId: user.employeeCode,
      message: `Employee account ${user.employeeCode} (${user.username}) was approved`
    });

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

    // Record audit
    const actor = await resolveActor(req.user);
    await recordAudit({
      actor,
      action: "EMPLOYEE_REJECTED",
      targetType: "EMPLOYEE",
      targetId: user.employeeCode,
      message: `Employee registration ${user.employeeCode} (${user.username}) was rejected`
    });

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

    // Record audit
    const actor = await resolveActor(req.user);
    await recordAudit({
      actor,
      action: "EMPLOYEE_UPDATED",
      targetType: "EMPLOYEE",
      targetId: employee.employeeCode,
      message: `Employee ${employee.name} (${employee.employeeCode}) was updated`
    });

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

    // Record audit
    const actor = await resolveActor(req.user);
    await recordAudit({
      actor,
      action: "EMPLOYEE_DELETED",
      targetType: "EMPLOYEE",
      targetId: employeeCode,
      message: `Employee ${employee.name} (${employeeCode}) was deleted`
    });

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

// Get audit logs (recent activity)
exports.getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100,
    );
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.action) {
      filter.action = req.query.action;
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .select("-__v")
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      message: "Audit logs retrieved successfully",
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      logs,
    });
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    return res.status(500).json({
      message: "Server error while fetching audit logs",
    });
  }
};

// Get pending profile change requests
exports.getProfileChangeRequests = async (req, res) => {
  try {
    const requests = await ProfileChangeRequest.find({
      status: "PENDING",
    })
      .select("-__v")
      .sort({ created_at: -1 })
      .lean();

    // Convert the Map field to a plain object for JSON
    const formatted = requests.map((request) => ({
      ...request,
      requestedChanges: request.requestedChanges || {},
    }));

    return res.status(200).json({
      message: "Profile change requests retrieved successfully",
      total: formatted.length,
      requests: formatted,
    });
  } catch (err) {
    console.error("Error fetching profile change requests:", err);
    return res.status(500).json({
      message: "Server error while fetching profile change requests",
    });
  }
};

// Approve a profile change request
exports.approveProfileChange = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await ProfileChangeRequest.findOne({ requestId });

    if (!request) {
      return res.status(404).json({
        message: "Profile change request not found",
      });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({
        message: "This request has already been reviewed",
      });
    }

    const employee = await Employee.findOne({
      employeeCode: request.employeeCode,
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    // Apply the requested new values
    request.requestedChanges.forEach((change, field) => {
      employee[field] = change.new;
    });

    await employee.save();

    request.status = "APPROVED";
    request.reviewedBy = req.user.employeeCode;
    request.reviewedAt = new Date();
    await request.save();

    // Notify employee
    try {
      await sendEmail({
        to: employee.email,
        subject: "Profile Change Request Approved",
        html: `
          <h2>Profile Change Approved</h2>
          <p>
            Your requested profile changes have been approved and applied.
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

    // Record audit
    const actor = await resolveActor(req.user);
    await recordAudit({
      actor,
      action: "PROFILE_CHANGE_APPROVED",
      targetType: "PROFILE_CHANGE_REQUEST",
      targetId: request.requestId,
      message: `Profile change ${request.requestId} for ${employee.name} (${employee.employeeCode}) was approved`,
    });

    return res.status(200).json({
      message: "Profile change request approved successfully",
      request: {
        requestId: request.requestId,
        status: request.status,
      },
    });
  } catch (err) {
    console.error("Error approving profile change:", err);
    return res.status(500).json({
      message: "Server error during profile change approval",
    });
  }
};

// Reject a profile change request
exports.rejectProfileChange = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await ProfileChangeRequest.findOne({ requestId });

    if (!request) {
      return res.status(404).json({
        message: "Profile change request not found",
      });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({
        message: "This request has already been reviewed",
      });
    }

    request.status = "REJECTED";
    request.reviewedBy = req.user.employeeCode;
    request.reviewedAt = new Date();
    await request.save();

    // Notify employee
    try {
      await sendEmail({
        to: request.email,
        subject: "Profile Change Request Rejected",
        html: `
          <h2>Profile Change Rejected</h2>
          <p>
            Your requested profile changes have been rejected.
            Please contact the administrator for more details.
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

    // Record audit
    const actor = await resolveActor(req.user);
    await recordAudit({
      actor,
      action: "PROFILE_CHANGE_REJECTED",
      targetType: "PROFILE_CHANGE_REQUEST",
      targetId: request.requestId,
      message: `Profile change ${request.requestId} for ${request.employeeName} (${request.employeeCode}) was rejected`,
    });

    return res.status(200).json({
      message: "Profile change request rejected successfully",
      request: {
        requestId: request.requestId,
        status: request.status,
      },
    });
  } catch (err) {
    console.error("Error rejecting profile change:", err);
    return res.status(500).json({
      message: "Server error during profile change rejection",
    });
  }
};
