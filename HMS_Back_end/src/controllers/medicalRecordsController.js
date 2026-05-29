const MedicalRecords = require("../models/MedicalRecords");
const Appointment = require("../models/Appointments");

// Create Medical Record
exports.createMedicalRecord = async (req, res) => {
    try {
        const {
            appointmentId,
            patientId,
            doctorEmployeeId,
            symptoms,
            diagnosis,
            prescriptionItems,
            notes
        } = req.body;

        // Validate appointment exists
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        // Create medical record
        const record = new MedicalRecords({
            appointmentId,
            patientId,
            doctorEmployeeId,
            symptoms,
            diagnosis,
            prescriptionItems,
            notes
        });

        await record.save();

        res.status(201).json({
            message: "Medical record created successfully",
            record
        });
    } catch (err) {
        console.error("Error creating medical record: ", err);
        res.status(500).json({
            message: "Server error while creating medical record"
        });
    }
}

// Get all medical records
exports.getAllRecords = async (req, res) => {
    try {
        const { page = 1, limit = 10, patientId, doctorEmployeeId } = req.query;
        const skip = (page - 1) * limit;

        let filter = {};
        if (patientId) filter.patientId = patientId;
        if (doctorEmployeeId) filter.doctorEmployeeId = doctorEmployeeId;

        const records = await MedicalRecords.find(filter)
            .populate('patientId', 'name email UHID')
            .populate('doctorEmployeeId', 'name specialization')
            .populate('appointmentId', 'appointmentDate timeSlot')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ created_at: -1 });

        const total = await MedicalRecords.countDocuments(filter);

        res.status(200).json({
            message: "Medical records retrieved successfully",
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            records
        });
    } catch (err) {
        console.error("Error retrieving medical records: ", err);
        res.status(500).json({
            message: "Server error while retrieving medical records"
        });
    }
}

// Get medical record by ID
exports.getRecordById = async (req, res) => {
    try {
        const { id } = req.params;

        const record = await MedicalRecords.findById(id)
            .populate('patientId', 'name email phone UHID')
            .populate('doctorEmployeeId', 'name specialization department')
            .populate('appointmentId', 'appointmentDate timeSlot status');

        if (!record) {
            return res.status(404).json({
                message: "Medical record not found"
            });
        }

        res.status(200).json({
            message: "Medical record retrieved successfully",
            record
        });
    } catch (err) {
        console.error("Error retrieving medical record: ", err);
        res.status(500).json({
            message: "Server error while retrieving medical record"
        });
    }
}

// Update medical record
exports.updateRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const { symptoms, diagnosis, prescriptionItems, notes } = req.body;

        const record = await MedicalRecords.findByIdAndUpdate(
            id,
            { $set: { symptoms, diagnosis, prescriptionItems, notes } },
            { new: true, runValidators: true }
        ).populate('patientId', 'name email UHID');

        if (!record) {
            return res.status(404).json({
                message: "Medical record not found"
            });
        }

        res.status(200).json({
            message: "Medical record updated successfully",
            record
        });
    } catch (err) {
        console.error("Error updating medical record: ", err);
        res.status(500).json({
            message: "Server error while updating medical record"
        });
    }
}

// Delete medical record
exports.deleteRecord = async (req, res) => {
    try {
        const { id } = req.params;

        const record = await MedicalRecords.findByIdAndDelete(id);

        if (!record) {
            return res.status(404).json({
                message: "Medical record not found"
            });
        }

        res.status(200).json({
            message: "Medical record deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting medical record: ", err);
        res.status(500).json({
            message: "Server error while deleting medical record"
        });
    }
}

// Get patient medical records
exports.getPatientRecords = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const records = await MedicalRecords.find({ patientId })
            .populate('doctorEmployeeId', 'name specialization')
            .populate('appointmentId', 'appointmentDate')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ created_at: -1 });

        const total = await MedicalRecords.countDocuments({ patientId });

        res.status(200).json({
            message: "Patient medical records retrieved successfully",
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            records
        });
    } catch (err) {
        console.error("Error retrieving patient medical records: ", err);
        res.status(500).json({
            message: "Server error while retrieving patient medical records"
        });
    }
}
