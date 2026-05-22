const appointmentModel = require("../models/Appointments");

exports.getAllAppointments = async (req, res) => {
    try {
        const htmlContents = await appointmentModel.find().limit(3);
        // console.log(htmlContents);
        
        res.json(htmlContents);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};