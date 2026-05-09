const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Employee = require("../models/Employee");

//Signup
exports.signup = async (req, res) => {
    try {
        const {
            email,
            password,
            name,
            phone,
            department,
            designation,
            status,
            joiningDate,
            medicalRegistrationNumber,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots
        } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "Email already registered" });
        }
        const password_hash = await bcrypt.hash(password, 12);

        const employee = new Employee();
        employee.email = email;
        employee.name = name;
        employee.phone = phone;
        employee.department = department;
        employee.designation = designation;
        employee.status = status;
        employee.joiningDate = joiningDate;
        employee.medicalRegistrationNumber = medicalRegistrationNumber;
        employee.specialization = specialization;
        employee.qualification = qualification;
        employee.consultationFee = consultationFee;
        employee.availabilitySlots = availabilitySlots;

        const savedEmployee = await employee.save();

        //const employee=await Employee.create(req.body);

        res.status(201).json({
            success: true,
            message: "Employee Created Successfully",
            data: savedEmployee
        });

        // Generate verification token
        const verification_token = crypto.randomBytes(32).toString("hex");
        const verification_token_expiry = new Date(
            Date.now() + 24 * 60 * 60 * 1000,
        ); // 24 hours

        const user = await User.create({
            email,
            passwordHash: password_hash,
            role: designation,
            employeeId: savedEmployee.employeeId,
            verification_token,
            verification_token_expiry,
        });
        const token = jwt.sign(
            { id: user.employeeId, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(201).json({
            success: true,
            message: "Employee Created Successfully",
            token,
            data: savedEmployee
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

//Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        user.last_login = new Date();
        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN },
        );
        const profile = await Employee.findOne({ employeeId: user.employeeId });
        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.employeeId,
                email: user.email,
                role: user.role,
                // is_verified: user.is_verified,
                lastloginAt: user.last_login,
                profile,
            },
        });

    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
