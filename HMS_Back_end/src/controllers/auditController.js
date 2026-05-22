const auditModel = require("../models/AuditLog");

exports.getAllAuditLogs = async (req, res) => {
    try {
        const auditLogs = await auditModel.find().limit(5);
        // console.log(auditLogs);
        
        res.json(auditLogs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};