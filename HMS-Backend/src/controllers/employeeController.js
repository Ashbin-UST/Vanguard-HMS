const Employee = require("../models/employeeModel");

/**
 * ─── CREATE EMPLOYEE ──────────────────────────────────────────
 * (unchanged — kept for completeness)
 */
exports.createEmployee = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            department,
            designation,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots,
            joiningDate,
            status,
        } = req.body;

        if (
            !name ||
            !phone ||
            !email ||
            !department ||
            !designation ||
            !medicalRegistrationNo
        ) {
            return res.status(400).json({
                success: false,
                message: "Some fields are missing",
            });
        }

        const existingPhone = await Employee.findOne({ phone });
        if (existingPhone) {
            return res.status(409).json({
                success: false,
                message: `Employee with phone number "${phone}" already exists`,
            });
        }

        const existingEmail = await Employee.findOne({
            email: email.toLowerCase().trim(),
        });
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: `Employee with email "${email}" already exists`,
            });
        }

        const existingRegNo = await Employee.findOne({ medicalRegistrationNo });
        if (existingRegNo) {
            return res.status(409).json({
                success: false,
                message: `Employee with Medical Registration No "${medicalRegistrationNo}" already exists`,
            });
        }

        const employee = new Employee({
            name,
            phone,
            email,
            department,
            designation,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots,
            joiningDate,
            status,
        });

        const savedEmployee = await employee.save();
        return res.status(201).json({
            success: true,
            message: "Employee created successfully",
            data: savedEmployee,
        });
    } catch (error) {
        console.log("Employee Controller Error: ", error);
        return res.status(500).json({
            success: false,
            message: "Server error during creating Employee",
        });
    }
};

/**
 * ─── GET ALL EMPLOYEES (with search, filter, pagination) ─────
 * ★ COMPLETELY REWRITTEN ★
 *
 * Query params:
 *   page      → default 1
 *   limit     → default 10
 *   status    → ACTIVE | INACTIVE
 *   department→ OPD | IPD | Lab | Pharmacy | Admin
 *   search    → searches name, phone, email, employeeCode
 *
 * Access: ADMIN, OWNER
 */
exports.getEmployees = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, department, search } = req.query;

        // ── Build filter ──────────────────────────────────────────
        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (department) {
            filter.department = department;
        }

        // ── Search across multiple fields ─────────────────────────
        if (search && search.trim().length >= 2) {
            const regex = new RegExp(search.trim(), "i");
            filter.$or = [
                { name: regex },
                { phone: regex },
                { email: regex },
                { employeeCode: regex },
            ];
        }

        // ── Execute queries ───────────────────────────────────────
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        const [employees, total] = await Promise.all([
            Employee.find(filter)
                .select("-__v")
                .sort({ createdAt: -1 })
                .limit(limitNum)
                .skip((pageNum - 1) * limitNum),
            Employee.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            message: "Employees retrieved successfully",
            data: employees,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        console.log("getEmployees error:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * ─── GET EMPLOYEE BY ID ──────────────────────────────────────
 * ★ NEW — needed for edit form pre-fill ★
 */
exports.getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;

        const employee = await Employee.findById(id).select("-__v");

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: employee,
        });
    } catch (error) {
        console.log("getEmployeeById error:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * ─── UPDATE EMPLOYEE ─────────────────────────────────────────
 * Enhanced with conflict checks matching patientController pattern
 */
exports.updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        // Prevent overwriting system-generated fields
        delete updates.employeeCode;
        delete updates._id;

        // If email is being updated, check uniqueness
        if (updates.email) {
            const existingEmail = await Employee.findOne({
                email: updates.email.toLowerCase().trim(),
                _id: { $ne: id },
            });
            if (existingEmail) {
                return res.status(409).json({
                    success: false,
                    message: `Email "${updates.email}" is already in use by another employee`,
                });
            }
            updates.email = updates.email.toLowerCase().trim();
        }

        // If phone is being updated, check uniqueness
        if (updates.phone) {
            const existingPhone = await Employee.findOne({
                phone: updates.phone,
                _id: { $ne: id },
            });
            if (existingPhone) {
                return res.status(409).json({
                    success: false,
                    message: `Phone number "${updates.phone}" is already in use by another employee`,
                });
            }
        }

        // If medicalRegistrationNo is being updated, check uniqueness
        if (updates.medicalRegistrationNo) {
            const existingRegNo = await Employee.findOne({
                medicalRegistrationNo: updates.medicalRegistrationNo,
                _id: { $ne: id },
            });
            if (existingRegNo) {
                return res.status(409).json({
                    success: false,
                    message: `Medical Registration No "${updates.medicalRegistrationNo}" is already in use`,
                });
            }
        }

        if (updates.qualification) {
            updates.qualification = updates.qualification.filter(
                (q) => q && q.trim(),
            );
        }

        const employee = await Employee.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Employee updated successfully",
            data: employee,
        });
    } catch (error) {
        console.log("updateEmployee error:", error);

        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res
                .status(400)
                .json({ success: false, message: messages.join(", ") });
        }

        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * ─── TOGGLE EMPLOYEE STATUS (soft delete) ────────────────────
 * (unchanged logic, response message improved)
 */
exports.toggleEmployeeStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const employee = await Employee.findById(id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found",
            });
        }

        employee.status = employee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        await employee.save();

        return res.status(200).json({
            success: true,
            message: `Employee ${employee.status === "ACTIVE" ? "activated" : "deactivated"} successfully`,
            data: employee,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};