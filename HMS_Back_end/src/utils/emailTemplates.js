// Centralized email templates.

const frontendUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:4200").replace(/\/+$/, "");

const loginUrl = () => `${frontendUrl()}/login`;

// Shared wrapper so every email has a consistent signature/branding.
const wrap = (innerHtml) => `
  ${innerHtml}
  <p>
    Regards,
    <br />
    HMS Team
  </p>
`;

const loginButton = (label = "Login to HMS") => `
  <p>
    <a href="${loginUrl()}">${label}</a>
  </p>
`;

// Formats a date (Date or ISO string) for display in emails, date-only.
const formatDate = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return String(value);
  }
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// --- Account credentials --------------------------------------------------

// Employee account created by an admin/owner — sends login credentials.
const employeeCredentials = ({ username, temporaryPassword }) => ({
  subject: "HMS Employee Account Created",
  html: wrap(`
    <h2>Welcome to HMS</h2>
    <p>Your employee account has been created successfully.</p>
    <p><strong>Username:</strong> ${username}</p>
    <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
    <p>Please login using the link below and change your password immediately.</p>
    ${loginButton()}
  `),
});

// Admin account created by an owner — sends login credentials.
const adminCredentials = ({ username, temporaryPassword }) => ({
  subject: "HMS Admin Account Created",
  html: wrap(`
    <h2>Welcome to HMS</h2>
    <p>Your admin account has been created successfully.</p>
    <p><strong>Username:</strong> ${username}</p>
    <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
    <p>Please login using the link below and change your password immediately.</p>
    ${loginButton()}
  `),
});

// Patient account created — sends login credentials.
const patientCredentials = ({ email, temporaryPassword }) => ({
  subject: "HMS Patient Account Created",
  html: wrap(`
    <h2>Welcome to HMS</h2>
    <p>Your patient account has been created successfully.</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
    <p>Please login using the link below and change your password immediately.</p>
    ${loginButton("Patient Login")}
  `),
});

// --- Account lifecycle ----------------------------------------------------

// Self-registered employee was approved by an admin.
const accountApproved = () => ({
  subject: "HMS Employee Account Approved",
  html: wrap(`
    <h2>Welcome to HMS</h2>
    <p>Your employee account has been approved. You can login to HMS.</p>
    ${loginButton()}
  `),
});

// Self-registered employee was rejected by an admin.
const accountRejected = () => ({
  subject: "HMS Employee Account Registration Rejected",
  html: wrap(`
    <h2>HMS Registration Request Rejected</h2>
    <p>
      Your registration has been rejected.
      Please contact the administrator/support team for more details.
    </p>
  `),
});

// Notify admins that a new employee has self-registered and needs review.
const registrationRequest = ({ name, employeeCode, department, designation }) => ({
  subject: "New Employee Registration Request",
  html: wrap(`
    <h2>New Employee Registration Request</h2>
    <p>A new employee has submitted a registration request and is awaiting approval.</p>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Employee Code:</strong> ${employeeCode}</p>
    <p><strong>Department:</strong> ${department}</p>
    <p><strong>Designation:</strong> ${designation}</p>
    <p>Please review the request from the admin dashboard.</p>
    ${loginButton("Open Admin Dashboard")}
  `),
});

// --- Profile change requests ----------------------------------------------

// Notify admins that an employee requested a profile change.
const profileChangeRequest = ({ name, employeeCode }) => ({
  subject: "Employee Profile Change Request",
  html: wrap(`
    <h2>Profile Change Request</h2>
    <p>
      ${name} (${employeeCode}) has requested changes to their profile and is
      awaiting approval.
    </p>
    <p>Please review the request from the admin dashboard.</p>
    ${loginButton("Open Admin Dashboard")}
  `),
});

const profileChangeApproved = () => ({
  subject: "Profile Change Request Approved",
  html: wrap(`
    <h2>Profile Change Approved</h2>
    <p>Your requested profile changes have been approved and applied.</p>
  `),
});

const profileChangeRejected = () => ({
  subject: "Profile Change Request Rejected",
  html: wrap(`
    <h2>Profile Change Rejected</h2>
    <p>
      Your requested profile changes have been rejected.
      Please contact the administrator for more details.
    </p>
  `),
});

// --- Appointments ---------------------------------------------------------

const appointmentScheduled = ({
  patientName,
  doctorName,
  appointmentDate,
  timeSlot,
}) => ({
  subject: "Appointment Scheduled",
  html: wrap(`
    <h2>Welcome to HMS</h2>
    <p>Your appointment has been created successfully.</p>
    <p><strong>Patient Name:</strong> ${patientName}</p>
    <p><strong>Doctor Name:</strong> ${doctorName}</p>
    <p><strong>Appointment Date:</strong> ${formatDate(appointmentDate)}</p>
    <p><strong>Time Slot:</strong> ${timeSlot}</p>
  `),
});

const appointmentUpdated = ({
  patientName,
  doctorName,
  appointmentDate,
  timeSlot,
}) => ({
  subject: "Appointment Updated",
  html: wrap(`
    <h2>Appointment Updated</h2>
    <p>Your appointment details have been updated.</p>
    <p><strong>Patient Name:</strong> ${patientName}</p>
    <p><strong>Doctor Name:</strong> ${doctorName}</p>
    <p><strong>Appointment Date:</strong> ${formatDate(appointmentDate)}</p>
    <p><strong>Time Slot:</strong> ${timeSlot}</p>
  `),
});

// --- Password reset -------------------------------------------------------

const passwordReset = ({ resetToken }) => ({
  subject: "HMS Password Reset Request",
  html: wrap(`
    <h2>HMS Password Reset</h2>
    <p>Use the link below to reset your password.</p>
    <p>
      <a href="${frontendUrl()}/reset-password?token=${resetToken}">
        Reset Password
      </a>
    </p>
    <p>This reset link expires in 15 minutes.</p>
    <p>If you did not request this, ignore this email.</p>
  `),
});

module.exports = {
  frontendUrl,
  loginUrl,
  employeeCredentials,
  adminCredentials,
  patientCredentials,
  accountApproved,
  accountRejected,
  registrationRequest,
  profileChangeRequest,
  profileChangeApproved,
  profileChangeRejected,
  appointmentScheduled,
  appointmentUpdated,
  passwordReset,
};