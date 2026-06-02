const bcrypt = require("bcryptjs");
const User = require("../models/Users");
const Employee = require("../models/Employees");
const sendEmail = require("./sendEmail");
const generateTemporaryPassword = require("./generateTemporaryPassword");
const buildEmployeeData = require("./buildEmployeeData");
const validateUniqueEmployeeFields = require("./validateUniqueEmployeeFields");
const recordAudit = require("./recordAudit");
const resolveActor = require("./resolveActor");

/**
 * @param {object} req - Express request
 * @param {object} options
 * @param {string[]} options.roles - User roles to assign (e.g. ["STAFF"] or ["ADMIN"])
 * @param {Function} options.emailTemplate - Template fn called with { username, temporaryPassword }
 * @param {string} options.auditAction - Audit log action string
 * @param {Function} options.buildAuditMessage - Called with (employee) -> string
 * @returns {{ employee, user }} - Resolves with the created documents; throws on failure
 */

async function createAccountWithEmployee(
    req,
    { roles, emailTemplate, auditAction, buildAuditMessage }
) {
    const { username, email } = req.body;

    const uniquenessResult = await validateUniqueEmployeeFields(req.body);
    if (!uniquenessResult.success) {
        const err = new Error(uniquenessResult.message);
        err.status = uniquenessResult.status;
        throw err;
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const employeeData = buildEmployeeData(req.body);

    const employee = new Employee(employeeData);
    await employee.save();

    const user = new User({
        username,
        email,
        passwordHash,
        roles,
        employeeCode: employee.employeeCode,
        status: "ACTIVE",
        mustChangePassword: true,
        createdByAdmin: true,
        approvedBy: req.user.employeeCode,
        approvedAt: new Date(),
        createdBy: req.user.employeeCode,
    });
    await user.save();

    try {
        await sendEmail({
            to: user.email,
            ...emailTemplate({ username, temporaryPassword }),
        });
    } catch (emailError) {
        console.error("Email sending error:", emailError);
    }

    const actor = await resolveActor(req.user);
    await recordAudit({
        actor,
        action: auditAction,
        targetType: "EMPLOYEE",
        targetId: employee.employeeCode,
        message: buildAuditMessage(employee),
    });

    return { employee, user };
}

module.exports = createAccountWithEmployee;