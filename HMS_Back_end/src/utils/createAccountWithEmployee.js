const bcrypt = require("bcryptjs");
const User = require("../models/Users");
const Employee = require("../models/Employees");
const sendEmail = require("./sendEmail");
const generateTemporaryPassword = require("./generateTemporaryPassword");
const buildEmployeeData = require("./buildEmployeeData");
const validateUniqueEmployeeFields = require("../validators/validateUniqueEmployeeFields");
const recordAudit = require("./recordAudit");
const resolveActor = require("./resolveActor");

// Creates an employee + user account together; throws on uniqueness violations or DB errors
async function createAccountWithEmployee(
    req,
    { roles, emailTemplate, auditAction, buildAuditMessage }
) {
    const { username, email } = req.body;

    // Reject if username, email, or medical reg number is already taken
    const uniquenessResult = await validateUniqueEmployeeFields(req.body);
    if (!uniquenessResult.success) {
        const err = new Error(uniquenessResult.message);
        err.status = uniquenessResult.status;
        throw err;
    }

    // Generate a temporary password that the user must change on first login
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const employeeData = buildEmployeeData(req.body);

    // Persist the employee record (pre-save hook assigns employeeCode)
    const employee = new Employee(employeeData);
    await employee.save();

    // Create the linked user account with mustChangePassword set to true
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

    // Email the temporary password; failure does not block account creation
    try {
        await sendEmail({
            to: user.email,
            ...emailTemplate({ username, temporaryPassword }),
        });
    } catch (emailError) {
        console.error("Email sending error:", emailError);
    }

    // Log the creation action
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
