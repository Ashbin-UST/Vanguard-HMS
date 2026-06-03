const axios = require("axios");
const https = require("node:https");

const sendEmail = async ({ to, subject, html }) => {

    const agent = new https.Agent({
        rejectUnauthorized: false
    });
    await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        {
            sender: {
                email: process.env.EMAIL_USER,
            },
            to: [
                {
                    email: to,
                },
            ],
            subject,
            htmlContent: html,
        },
        {
            headers: {
                "api-key": process.env.BREVO_API_KEY,
                "Content-Type": "application/json",
            },
            httpsAgent: agent
        }
    );
};

module.exports = sendEmail;