const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/Users");
const Employee = require("../models/Employees");
const sendEmail = require("../utils/sendEmail");
const sanitizeQualifications = require("../utils/qualificationSanitizer");

// Employee self registration
exports.registerEmployee = async (req, res) => {
  let employee;
  let user;

  const {
    username,
    email,
    password,
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

    // Prevent self-registration as ADMIN or OWNER
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

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

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
        status: "PENDING",
        mustChangePassword: false,
        createdByAdmin: false,
        approvedBy: null,
        approvedAt: null,
        createdBy: null,
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
};