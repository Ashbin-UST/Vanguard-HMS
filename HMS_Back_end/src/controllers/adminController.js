const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/Users");
const Employee = require("../models/Employees");
const sendEmail = require("../utils/sendEmail");
const generateTemporaryPassword = require("../utils/generateTemporaryPassword");
const sanitizeQualifications = require("../utils/qualificationSanitizer");

// Employee Account Creation
exports.createEmployee = async (req, res) => {
  let employee;
  let user;
  let temporaryPassword;

  const {
    username,
    email,
    name,
    phone,
    department,
    designation,
    joiningDate,
    medicalRegistrationNumber,
    specialization,
    qualification,
    consultationFee,
    availabilitySlots,
  } = req.body;

  try {
    // Prevent admin from creating ADMIN or OWNER accounts
    if (["ADMIN", "OWNER"].includes(designation)) {
      return res.status(403).json({
        message: "Invalid designation. Cannot create admin or owner accounts.",
      });
    }

    // Check existing username
    const existingUsername = await User.findOne({
      username,
    });

    if (existingUsername) {
      return res.status(409).json({
        message: "Username already exists",
      });
    }

    // Check existing user email
    const existingUserEmail = await User.findOne({
      email,
    });

    if (existingUserEmail) {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    // Check existing employee email
    const existingEmployeeEmail = await Employee.findOne({
      email,
    });

    if (existingEmployeeEmail) {
      return res.status(409).json({
        message: "Employee email already exists",
      });
    }

    // Check medical registration uniqueness
    if (["DOCTOR", "NURSE", "LAB_TECH", "PHARMACIST"].includes(designation)) {
      const existingMedicalRegistration = await Employee.findOne({
        medicalRegistrationNumber,
      });

      if (existingMedicalRegistration) {
        return res.status(409).json({
          message: "Medical registration number already exists",
        });
      }
    }

    // Generate temporary password
    temporaryPassword = generateTemporaryPassword();

    // Hash password
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // Build employee data
    const employeeData = {
      name,
      phone,
      email,
      department,
      designation,
      joiningDate,
      qualification: sanitizeQualifications(qualification),
    };

    // Add medical registration field
    if (["DOCTOR", "NURSE", "LAB_TECH", "PHARMACIST"].includes(designation)) {
      employeeData.medicalRegistrationNumber = medicalRegistrationNumber;
    }

    // Add specialization
    if (["DOCTOR", "LAB_TECH"].includes(designation)) {
      employeeData.specialization = specialization;
    }

    // Add doctor-only fields
    if (designation === "DOCTOR") {
      employeeData.consultationFee = consultationFee;

      employeeData.availabilitySlots = availabilitySlots;
    }

    // Start session AFTER validations
    const session = await mongoose.startSession();

    try {
      // Start transaction
      session.startTransaction();

      // Create employee
      employee = new Employee(employeeData);

      await employee.save({ session });

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

      await user.save({ session });

      // Commit transaction
      await session.commitTransaction();
    } catch (err) {
      // Rollback transaction safely
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      throw err;
    } finally {
      session.endSession();
    }

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

    // Merge employee + user data
    const formattedEmployees = employees.map((employee) => {
      // Find matching user

      const matchedUser = users.find(
        (user) => user.employeeCode === employee.employeeCode,
      );

      return {
        employeeCode: employee.employeeCode,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        department: employee.department,
        designation: employee.designation,
        qualification: employee.qualification,
        joiningDate: employee.joiningDate,
        status: matchedUser?.status,
        roles: matchedUser?.roles,
        lastLoginAt: matchedUser?.lastLoginAt,
      };
    });

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
exports.getEmployees = async (req, res) => {
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

    // Merge employee + user data
    const formattedEmployees = employees.map((employee) => {
      // Find matching user

      const matchedUser = users.find(
        (user) => user.employeeCode === employee.employeeCode,
      );

      return {
        employeeCode: employee.employeeCode,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        department: employee.department,
        designation: employee.designation,
        qualification: employee.qualification,
        joiningDate: employee.joiningDate,
        status: matchedUser?.status,
        roles: matchedUser?.roles,
        lastLoginAt: matchedUser?.lastLoginAt,
      };
    });

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
    if (["ADMIN", "OWNER"].some((role) => user.roles.includes(role))) {
      return res.status(403).json({
        message: "Only STAFF accounts can be approved",
      });
    }

    //Ensure current status as pending
    if (user.status !== "PENDING") {
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
    if (["ADMIN", "OWNER"].some((role) => user.roles.includes(role))) {
      return res.status(403).json({
        message: "Only STAFF accounts can be rejected",
      });
    }

    //Ensure current status as pending
    if (user.status !== "PENDING") {
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

    // Prevent updating OWNER or ADMIN
    if (["OWNER", "ADMIN"].includes(employee.designation)) {
      return res.status(403).json({
        message: "Cannot update OWNER or ADMIN accounts",
      });
    }

    // Prevent designation change
    if (req.body.designation && req.body.designation !== employee.designation) {
      return res.status(403).json({
        message: "Employee designation cannot be changed",
      });
    }

    // Allowed fields only
    const allowedFields = [
      "name",
      "phone",
      "department",
      "qualification",
      "specialization",
      "consultationFee",
      "availabilitySlots",
    ];

    // Update only allowed fields
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        // Sanitize qualifications
        if (field === "qualification") {
          employee[field] = sanitizeQualifications(req.body[field]);
        } else {
          employee[field] = req.body[field];
        }
      }
    });

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
    if (["OWNER", "ADMIN"].includes(employee.designation)) {
      return res.status(403).json({
        message: "Cannot delete OWNER or ADMIN accounts",
      });
    }

    // Start transaction
    session.startTransaction();

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

    // Commit transaction
    await session.commitTransaction();

    return res.status(200).json({
      message: "Employee deleted successfully",
    });
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Error during employee deletion:", err);
    return res.status(500).json({
      message: "Server error during employee deletion",
    });
  } finally {
    session.endSession();
  }
};
