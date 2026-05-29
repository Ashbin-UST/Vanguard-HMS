const AuditLog = require("../models/AuditLogs");

/**
 * Records an audit log entry.
 *
 * This helper never throws. Auditing must never break the primary
 * operation, so any failure is logged to the console and swallowed.
 *
 * @param {Object} params
 * @param {Object} [params.actor]      - The acting user/employee.
 * @param {string} [params.actor.employeeCode]
 * @param {string} [params.actor.name]
 * @param {string} [params.actor.designation]
 * @param {string}  params.action      - One of AuditLog.AUDIT_ACTIONS.
 * @param {string} [params.targetType] - e.g. "EMPLOYEE", "PATIENT", "APPOINTMENT".
 * @param {string} [params.targetId]   - Identifier of the affected entity.
 * @param {string}  params.message     - Human readable description.
 */
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
