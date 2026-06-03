const AuditLog = require("../models/AuditLogs");

// Write an audit log entry; failures are swallowed so auditing never breaks the calling operation
const recordAudit = async ({
    actor = {},
    action,
    targetType,
    targetId,
    message
}) => {
    try {
        await AuditLog.create({
            actorEmployeeCode: actor.employeeCode,
            actorName: actor.name,
            actorDesignation: actor.designation,
            action,
            targetType,
            targetId,
            message
        });
    } catch (err) {
        console.error("Audit log error:", err.message);
    }
};

module.exports = recordAudit;