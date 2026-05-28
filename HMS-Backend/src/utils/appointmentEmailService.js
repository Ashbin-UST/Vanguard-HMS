process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const Brevo = require("sib-api-v3-sdk");

const client = Brevo.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new Brevo.TransactionalEmailsApi();

/**
 * Send Appointment Confirmation Email
 */
const sendAppointmentConfirmationEmail = async (appointmentData) => {
    try {
        const { patientEmail, patientName, doctorName, date, timeSlot, department, consultationFee, appointmentId } = appointmentData;

        const formattedDate = new Date(date).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const response = await apiInstance.sendTransacEmail({
            sender: {
                email: process.env.BREVO_SENDER_EMAIL || "noreply@hospital.com",
                name: "Hospital Management System",
            },
            to: [
                {
                    email: patientEmail,
                    name: patientName,
                },
            ],
            subject: "Appointment Confirmed - Hospital Management System",
            htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d9488;">Appointment Confirmed ✓</h2>
          
          <p>Dear <strong>${patientName}</strong>,</p>
          
          <p>Your appointment has been successfully booked.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Appointment ID:</strong> ${appointmentId}</p>
            <p style="margin: 5px 0;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${timeSlot}</p>
            <p style="margin: 5px 0;"><strong>Department:</strong> ${department}</p>
            <p style="margin: 5px 0;"><strong>Consultation Fee:</strong> ₹${consultationFee}</p>
          </div>
          
          <p><strong>Important:</strong> Please arrive 15 minutes before your scheduled time.</p>
          
          <p>If you need to cancel or reschedule, please contact our reception.</p>
          
          <br/>
          <p>Best regards,<br/>Hospital Management System</p>
        </div>
      `,
        });

        console.log(`Appointment confirmation email sent to ${patientEmail}`);
        return response;
    } catch (err) {
        console.log("BREVO FULL ERROR:", err.response?.body || err);
        throw err;
    }
};

/**
 * Send Appointment Cancellation Email
 */
const sendAppointmentCancellationEmail = async (appointmentData) => {
    try {
        const { patientEmail, patientName, doctorName, date, timeSlot, reason, appointmentId } = appointmentData;

        const formattedDate = new Date(date).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const response = await apiInstance.sendTransacEmail({
            sender: {
                email: process.env.BREVO_SENDER_EMAIL || "noreply@hospital.com",
                name: "Hospital Management System",
            },
            to: [
                {
                    email: patientEmail,
                    name: patientName,
                },
            ],
            subject: "Appointment Cancelled - Hospital Management System",
            htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Appointment Cancelled</h2>
          
          <p>Dear <strong>${patientName}</strong>,</p>
          
          <p>Your appointment has been cancelled.</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 5px 0;"><strong>Appointment ID:</strong> ${appointmentId}</p>
            <p style="margin: 5px 0;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${timeSlot}</p>
            ${reason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>
          
          <p>To book a new appointment, please contact our reception or visit the hospital.</p>
          
          <br/>
          <p>Best regards,<br/>Hospital Management System</p>
        </div>
      `,
        });

        console.log(`Appointment cancellation email sent to ${patientEmail}`);
        return response;
    } catch (err) {
        console.log("BREVO FULL ERROR:", err.response?.body || err);
        throw err;
    }
};

/**
 * Send Appointment Reminder Email (Optional - can be used with cron job)
 */
const sendAppointmentReminderEmail = async (appointmentData) => {
    try {
        const { patientEmail, patientName, doctorName, date, timeSlot, appointmentId } = appointmentData;

        const formattedDate = new Date(date).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const response = await apiInstance.sendTransacEmail({
            sender: {
                email: process.env.BREVO_SENDER_EMAIL || "noreply@hospital.com",
                name: "Hospital Management System",
            },
            to: [
                {
                    email: patientEmail,
                    name: patientName,
                },
            ],
            subject: "Appointment Reminder - Tomorrow",
            htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d97706;">Appointment Reminder</h2>
          
          <p>Dear <strong>${patientName}</strong>,</p>
          
          <p>This is a reminder for your upcoming appointment tomorrow.</p>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Appointment ID:</strong> ${appointmentId}</p>
            <p style="margin: 5px 0;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${timeSlot}</p>
          </div>
          
          <p>Please arrive 15 minutes before your scheduled time.</p>
          
          <br/>
          <p>Best regards,<br/>Hospital Management System</p>
        </div>
      `,
        });

        console.log(`Appointment reminder email sent to ${patientEmail}`);
        return response;
    } catch (err) {
        console.log("BREVO FULL ERROR:", err.response?.body || err);
        throw err;
    }
};

module.exports = {
    sendAppointmentConfirmationEmail,
    sendAppointmentCancellationEmail,
    sendAppointmentReminderEmail,
};