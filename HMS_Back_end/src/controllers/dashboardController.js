const appointmentModel = require("../models/Appointments");
const employeeModel = require("../models/Employees");
const billingModel = require("../models/Bills");
exports.getDashboardData = async (req, res) => {
    try {
        const appointmentno = await appointmentModel.countDocuments();
        const employeeno = await employeeModel.countDocuments();
        const billingno = await billingModel.countDocuments();
        const appointments = await appointmentModel.find().limit(3);
        const employees = await employeeModel.find().limit(3);
        const billings = await billingModel.find().limit(3);
        res.json({ appointmentno, employeeno, billingno, appointments, employees, billings });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
        
    