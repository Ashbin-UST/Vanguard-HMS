const frontendUrl = () => {
  let url = process.env.FRONTEND_URL || "http://localhost:4200";
  while (url.endsWith("/")) url = url.slice(0, -1);
  return url;
};

const loginUrl = () => `${frontendUrl()}/login`;

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

const verifyButton = (verifyUrl) => `
  <p>
    <a href="${verifyUrl}">Verify Email</a>
  </p>
`;

// Sent to a self-registered employee — prompts them to verify their email before logging in.
const accountRegistered = ({ verifyUrl }) => ({
  subject: "HMS Account Registered — Please Verify Your Email",
  html: wrap(`
    <h2>Welcome to HMS</h2>
    <p>Your account has been registered successfully.</p>
    <p>Please verify your email address by clicking the button below before logging in.</p>
    ${verifyButton(verifyUrl)}
    <p>This link expires in 24 hours.</p>
  `),
});

module.exports = {
  accountRegistered,
  loginButton,
  loginUrl,
  frontendUrl,
};
