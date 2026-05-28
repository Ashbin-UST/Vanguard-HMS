process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const Brevo = require("sib-api-v3-sdk");

// Initialize Brevo client
const client = Brevo.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new Brevo.TransactionalEmailsApi();

/**
 * Send Welcome Email to New Employee (After Self-Registration)
 */
const sendRegistrationPendingEmail = async (employeeEmail, employeeName) => {
    try {
        const response = await apiInstance.sendTransacEmail({
            sender: {
                email: process.env.BREVO_SENDER_EMAIL || "noreply@hospital.com",
                name: "Hospital Management System",
            },
            to: [
                {
                    email: employeeEmail,
                    name: employeeName,
                },
            ],
            subject: "Registration Received - Pending Admin Approval",
            htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d9488;">Welcome to Hospital Management System!</h2>
          <p>Dear <strong>${employeeName}</strong>,</p>
          <p>Thank you for registering with our Hospital Management System.</p>
          <p>Your registration request has been received and is currently <strong>pending approval</strong> from the administrator.</p>
          <p>You will receive another email once your account is approved.</p>
          <br/>
          <p>Best regards,<br/>Hospital Admin Team</p>
        </div>
      `,
        });

        console.log(`Registration pending email sent to ${employeeEmail}`);
        return response;
    } catch (err) {
        console.log("BREVO FULL ERROR:", err.response?.body || err);
        throw err;
    }
};

/**
 * Send Approval Email to Employee
 */
const sendApprovalEmail = async (employeeEmail, employeeName, loginUrl) => {
    try {
        const response = await apiInstance.sendTransacEmail({
            sender: {
                email: process.env.BREVO_SENDER_EMAIL || "noreply@hospital.com",
                name: "Hospital Management System",
            },
            to: [
                {
                    email: employeeEmail,
                    name: employeeName,
                },
            ],
            subject: "Account Approved - You Can Now Login",
            htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Account Approved!</h2>
          <p>Dear <strong>${employeeName}</strong>,</p>
          <p>Great news! Your account has been <strong>approved</strong> by the administrator.</p>
          <p>You can now login to the Hospital Management System using your email and password.</p>
          <a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Login Now</a>
          <br/>
          <p>Best regards,<br/>Hospital Admin Team</p>
        </div>
      `,
        });

        console.log(`Approval email sent to ${employeeEmail}`);
        return response;
    } catch (err) {
        console.log("BREVO FULL ERROR:", err.response?.body || err);
        throw err;
    }
};

/**
 * Send Rejection Email to Employee
 */
const sendRejectionEmail = async (employeeEmail, employeeName, reason) => {
    try {
        const response = await apiInstance.sendTransacEmail({
            sender: {
                email: process.env.BREVO_SENDER_EMAIL || "noreply@hospital.com",
                name: "Hospital Management System",
            },
            to: [
                {
                    email: employeeEmail,
                    name: employeeName,
                },
            ],
            subject: "Account Registration Update",
            htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Registration Update</h2>
          <p>Dear <strong>${employeeName}</strong>,</p>
          <p>We regret to inform you that your registration request has been reviewed and cannot be approved at this time.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          <p>If you believe this is an error, please contact the hospital administration.</p>
          <br/>
          <p>Best regards,<br/>Hospital Admin Team</p>
        </div>
      `,
        });

        console.log(`Rejection email sent to ${employeeEmail}`);
        return response;
    } catch (err) {
        console.log("BREVO FULL ERROR:", err.response?.body || err);
        throw err;
    }
};

/**
 * Send Admin Notification Email (New Self-Registration)
 */
const sendAdminNotificationEmail = async (
    adminEmail,
    employeeName,
    employeeEmail,
) => {
    try {
        const response = await apiInstance.sendTransacEmail({
            sender: {
                email: process.env.BREVO_SENDER_EMAIL || "noreply@hospital.com",
                name: "Hospital Management System",
            },
            to: [
                {
                    email: adminEmail,
                },
            ],
            subject: "New Employee Registration - Pending Approval",
            htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d97706;">New Employee Registration</h2>
          <p>A new employee has registered and is pending your approval:</p>
          <ul>
            <li><strong>Name:</strong> ${employeeName}</li>
            <li><strong>Email:</strong> ${employeeEmail}</li>
          </ul>
          <p>Please login to the admin dashboard to review and approve/reject this registration.</p>
          <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; padding: 12px 24px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Go to Dashboard</a>
        </div>
      `,
        });

        console.log(`Admin notification email sent to ${adminEmail}`);
        return response;
    } catch (err) {
        console.log("BREVO FULL ERROR:", err.response?.body || err);
        throw err;
    }
};

/**
 * Send login Email (Admin Creates Employee)
 */
const sendTemporaryPasswordEmail = async (
    employeeEmail,
    employeeName,
    temporaryPassword,
    resetUrl,
) => {
    try {
        const response = await apiInstance.sendTransacEmail({
            sender: {
                email: process.env.BREVO_SENDER_EMAIL || "noreply@hospital.com",
                name: "Hospital Management System",
            },
            to: [
                {
                    email: employeeEmail,
                    name: employeeName,
                },
            ],
            subject: "Your Account Has Been Created",
            htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d9488;">Welcome to Hospital Management System!</h2>
          <p>Dear <strong>${employeeName}</strong>,</p>
          <p>An account has been created for you by the administrator.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Email:</strong> ${employeeEmail}</p>
          </div>
          
          <p><strong>Important:</strong> You must create a password before you can login.</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password Now</a>
          
          <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
          <br/>
          <p>Best regards,<br/>Hospital Admin Team</p>
        </div>
      `,
        });

        console.log(`Create password email sent to ${employeeEmail}`);
        return response;
    } catch (err) {
        console.log("BREVO FULL ERROR:", err.response?.body || err);
        throw err;
    }
};

/**
 * Send Password Reset Email (Forgot Password)
 */
const sendPasswordResetEmail = async (userEmail, userName, resetUrl) => {
    try {
        const response = await apiInstance.sendTransacEmail({
            sender: {
                email: process.env.BREVO_SENDER_EMAIL || "noreply@hospital.com",
                name: "Hospital Management System",
            },
            to: [
                {
                    email: userEmail,
                    name: userName,
                },
            ],
            subject: "Password Reset Request",
            htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d9488;">Password Reset Request</h2>
          <p>Dear <strong>${userName}</strong>,</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
          <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <br/>
          <p>Best regards,<br/>Hospital Admin Team</p>
        </div>
      `,
        });

        console.log(`Password reset email sent to ${userEmail}`);
        return response;
    } catch (err) {
        console.log("BREVO FULL ERROR:", err.response?.body || err);
        throw err;
    }
};

module.exports = {
    sendRegistrationPendingEmail,
    sendApprovalEmail,
    sendRejectionEmail,
    sendAdminNotificationEmail,
    sendTemporaryPasswordEmail,
    sendPasswordResetEmail,
};