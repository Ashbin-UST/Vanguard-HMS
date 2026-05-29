const Employee = require("../models/Employees");

/**
 * Resolves the acting employee's identity for audit logging.
 *
 * The JWT only carries employeeCode and roles, so when we need the
 * actor's name/designation for a readable audit trail we look it up.
 * Returns a plain object safe to spread into recordAudit({ actor }).
 *
 * @param {Object} reqUser - req.user decoded from the JWT.
 * @returns {Promise<{employeeCode: string, name?: string, designation?: string}>}
 */
const resolveActor = async (reqUser) => {
    const employeeCode = reqUser?.employeeCode;

    if (!employeeCode) {
        return {};
    }

    try {
        const employee = await Employee.findOne({ employeeCode }).select(
            "name designation"
        );

        return {
            employeeCode,
            name: employee?.name,
            designation: employee?.designation
        };
    } catch (err) {
        console.error("resolveActor error:", err.message);
        return { employeeCode };
    }
};

module.exports = resolveActor;
