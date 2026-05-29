const Bill = require("../models/Bills");
const Payment = require("../models/Payments");
const Appointment = require("../models/Appointments");
const Patient = require("../models/Patients");

// Create Bill
exports.createBill = async (req, res) => {
    try {
        const {
            patientId,
            appointmentId,
            items,
            total
        } = req.body;

        // Validate appointment exists
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found"
            });
        }

        // Create bill
        const bill = new Bill({
            patientId,
            appointmentId,
            items,
            total,
            status: 'PENDING',
            createdByEmployeeId: req.user.employeeCode
        });

        await bill.save();

        res.status(201).json({
            message: "Bill created successfully",
            bill
        });
    } catch (err) {
        console.error("Error creating bill: ", err);
        res.status(500).json({
            message: "Server error while creating bill"
        });
    }
}

// Get all bills
exports.getAllBills = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, patientId } = req.query;
        const skip = (page - 1) * limit;

        let filter = {};
        if (status) filter.status = status;
        if (patientId) filter.patientId = patientId;

        const bills = await Bill.find(filter)
            .populate('patientId', 'name email UHID')
            .populate('appointmentId', 'appointmentDate doctorEmployeeId')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Bill.countDocuments(filter);

        res.status(200).json({
            message: "Bills retrieved successfully",
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            bills
        });
    } catch (err) {
        console.error("Error retrieving bills: ", err);
        res.status(500).json({
            message: "Server error while retrieving bills"
        });
    }
}

// Get bill by ID
exports.getBillById = async (req, res) => {
    try {
        const { id } = req.params;

        const bill = await Bill.findById(id)
            .populate('patientId', 'name email phone UHID')
            .populate('appointmentId', 'appointmentDate doctorEmployeeId');

        if (!bill) {
            return res.status(404).json({
                message: "Bill not found"
            });
        }

        res.status(200).json({
            message: "Bill retrieved successfully",
            bill
        });
    } catch (err) {
        console.error("Error retrieving bill: ", err);
        res.status(500).json({
            message: "Server error while retrieving bill"
        });
    }
}

// Update bill
exports.updateBill = async (req, res) => {
    try {
        const { id } = req.params;
        const { items, total, status } = req.body;

        const bill = await Bill.findByIdAndUpdate(
            id,
            { $set: { items, total, status } },
            { new: true, runValidators: true }
        ).populate('patientId', 'name email UHID');

        if (!bill) {
            return res.status(404).json({
                message: "Bill not found"
            });
        }

        res.status(200).json({
            message: "Bill updated successfully",
            bill
        });
    } catch (err) {
        console.error("Error updating bill: ", err);
        res.status(500).json({
            message: "Server error while updating bill"
        });
    }
}

// Delete bill
exports.deleteBill = async (req, res) => {
    try {
        const { id } = req.params;

        const bill = await Bill.findByIdAndDelete(id);

        if (!bill) {
            return res.status(404).json({
                message: "Bill not found"
            });
        }

        res.status(200).json({
            message: "Bill deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting bill: ", err);
        res.status(500).json({
            message: "Server error while deleting bill"
        });
    }
}

// Get patient bills
exports.getPatientBills = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const bills = await Bill.find({ patientId })
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Bill.countDocuments({ patientId });

        res.status(200).json({
            message: "Patient bills retrieved successfully",
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            bills
        });
    } catch (err) {
        console.error("Error retrieving patient bills: ", err);
        res.status(500).json({
            message: "Server error while retrieving patient bills"
        });
    }
}

// Create Payment
exports.createPayment = async (req, res) => {
    try {
        const {
            billId,
            amount,
            method
        } = req.body;

        // Validate bill exists
        const bill = await Bill.findById(billId);
        if (!bill) {
            return res.status(404).json({
                message: "Bill not found"
            });
        }

        // Create payment
        const payment = new Payment({
            billId,
            amount,
            method,
            receivedByEmployeeId: req.user.employeeCode,
            paidAt: new Date()
        });

        await payment.save();

        // Update bill status if fully paid
        const totalPaid = amount;
        if (totalPaid >= bill.total) {
            bill.status = 'PAID';
        } else if (totalPaid > 0) {
            bill.status = 'PARTIAL';
        }
        await bill.save();

        res.status(201).json({
            message: "Payment recorded successfully",
            payment
        });
    } catch (err) {
        console.error("Error creating payment: ", err);
        res.status(500).json({
            message: "Server error while creating payment"
        });
    }
}

// Get all payments
exports.getAllPayments = async (req, res) => {
    try {
        const { page = 1, limit = 10, billId } = req.query;
        const skip = (page - 1) * limit;

        let filter = {};
        if (billId) filter.billId = billId;

        const payments = await Payment.find(filter)
            .populate('billId', 'billId total')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ paidAt: -1 });

        const total = await Payment.countDocuments(filter);

        res.status(200).json({
            message: "Payments retrieved successfully",
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            payments
        });
    } catch (err) {
        console.error("Error retrieving payments: ", err);
        res.status(500).json({
            message: "Server error while retrieving payments"
        });
    }
}

// Get payment by ID
exports.getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;

        const payment = await Payment.findById(id)
            .populate('billId', 'billId total patientId');

        if (!payment) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        res.status(200).json({
            message: "Payment retrieved successfully",
            payment
        });
    } catch (err) {
        console.error("Error retrieving payment: ", err);
        res.status(500).json({
            message: "Server error while retrieving payment"
        });
    }
}
