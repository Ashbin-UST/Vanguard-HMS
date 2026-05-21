const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Employee = require("../models/Employees");
const User = require("../models/Users");
const Patient = require("../models/Patients");
const sendEmail = require("../utils/sendEmail");
const generateTemporaryPassword = require("../utils/generateTemporaryPassword");

// Create Patient Account
exports.createPatient = async (req, res) => {

    try {
        const {
            name,
            phone,
            email,
            gender,
            dob,
            address,
            emergencyContact,
            status
        } = req.body;

        const existingPatient = await Patient.findOne({
            email
        });

        if (existingPatient) {
            return res.status(409).json({
                message: "Patient with this email is already registered"
            });
        }

        const temporaryPassword = generateTemporaryPassword();

        const passwordHash = await bcrypt.hash(temporaryPassword, 12);

        const patientData = {
            name,
            phone,
            email,
            passwordHash,
            gender,
            dob,
            address,
            emergencyContact,
            status,
            createdByEmployeeId: req.user.createdByEmployeeId
        };

        // Create Patient
        const patient = new Patient(patientData);
        await patient.save();

        // Send email AFTER successful account creation
            try {
              await sendEmail({
                to: user.email,
        
                subject: "HMS Patient Account Created",
        
                html: `
                  <h2>Welcome to HMS</h2>
        
                  <p>
                    Your patient account has been created successfully.
                  </p>
        
                  <p>
                    <strong>email:</strong>
                    ${email}
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
                      Patient Login
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
              message: "Patient account created successfully. Login credentials have been sent via email.",
              patient
            });
    }
    catch (err) {
        console.error("Error during patient account creation: ", err);
        return res.status(500).json({
            message: "Server error during patient account creation"
        });
    }
}