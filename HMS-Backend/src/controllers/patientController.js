const Patient = require('../models/patientModel');

/**
 * Create new patient
 * Access: RECEPTIONIST, NURSE, ADMIN, OWNER
 */
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
            medicalHistory,
            status
        } = req.body;

        // Validate required fields
        if (!name || !phone || !email || !gender || !dob) {
            return res.status(400).json({
                success: false,
                message: 'Name, phone, email, gender, and date of birth are required'
            });
        }

        // Check if email already exists
        const existingEmail = await Patient.findOne({ email: email.toLowerCase().trim() });
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: `Patient with email "${email}" already exists`
            });
        }

        // Validate date of birth (not in future)
        const dobDate = new Date(dob);
        if (dobDate > new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Date of birth cannot be in the future'
            });
        }

        // Create patient
        const patient = await new Patient({
            name,
            phone: phone.trim(),
            email: email.toLowerCase().trim(),
            gender,
            dob: dobDate,
            address,
            emergencyContact,
            medicalHistory,
            status: status || 'ACTIVE',
            registeredBy: req.user.id
        }).save();

        return res.status(201).json({
            success: true,
            message: 'Patient registered successfully',
            data: {
                UHID: patient.UHID,
                name: patient.name,
                phone: patient.phone,
                email: patient.email,
                gender: patient.gender,
                age: patient.age,
                status: patient.status,
                createdAt: patient.createdAt
            }
        });

    } catch (error) {
        console.log('Create patient error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }

        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get all patients (with pagination and filters)
 * Access: RECEPTIONIST, NURSE, ADMIN, OWNER
 */
exports.getAllPatients = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, gender } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (gender) filter.gender = gender;

        const patients = await Patient.find(filter)
            .select('-__v')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('registeredBy', 'email userId');

        const count = await Patient.countDocuments(filter);

        return res.status(200).json({
            success: true,
            message: 'Patients retrieved successfully',
            data: patients,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        console.log('Get all patients error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get patient by ID
 * Access: All authenticated users
 */
exports.getPatientById = async (req, res) => {
    try {
        const { id } = req.params;

        const patient = await Patient.findById(id)
            .select('-__v')
            .populate('registeredBy', 'email userId');

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Patient retrieved successfully',
            data: patient
        });

    } catch (error) {
        console.log('Get patient by ID error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Update patient
 * Access: RECEPTIONIST, ADMIN, OWNER
 */
exports.updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Prevent updating UHID
        delete updates.UHID;
        delete updates.registeredBy;

        // If email is being updated, check uniqueness
        if (updates.email) {
            const existingEmail = await Patient.findOne({
                email: updates.email.toLowerCase().trim(),
                _id: { $ne: id }
            });
            if (existingEmail) {
                return res.status(409).json({
                    success: false,
                    message: `Email "${updates.email}" is already in use by another patient`
                });
            }
            updates.email = updates.email.toLowerCase().trim();
        }

        const patient = await Patient.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Patient updated successfully',
            data: patient
        });

    } catch (error) {
        console.log('Update patient error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }

        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete patient
 * Access: ADMIN, OWNER only
 */
exports.deletePatient = async (req, res) => {
    try {
        const { id } = req.params;

        const patient = await Patient.findByIdAndDelete(id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Patient deleted successfully'
        });

    } catch (error) {
        console.log('Delete patient error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Search patients
 * Access: RECEPTIONIST, NURSE, ADMIN, OWNER
 */
exports.searchPatients = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }

        const searchQuery = q.trim();

        const patients = await Patient.find({
            $or: [
                { UHID: { $regex: searchQuery, $options: 'i' } },
                { name: { $regex: searchQuery, $options: 'i' } },
                { phone: { $regex: searchQuery, $options: 'i' } },
                { email: { $regex: searchQuery, $options: 'i' } }
            ]
        })
            .select('UHID name phone email gender dob status')
            .limit(20);

        return res.status(200).json({
            success: true,
            message: `Found ${patients.length} patient(s)`,
            data: patients
        });

    } catch (error) {
        console.log('Search patients error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};