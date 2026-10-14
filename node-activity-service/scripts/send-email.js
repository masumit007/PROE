// Optional syllabus demonstration. Configure SMTP variables in .env before running.
// Run from activity-service with: node scripts/send-email.js
require("dotenv").config();
async function main() {
  const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM", "EMAIL_TO"];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length) {
    console.error(`Email not configured. Missing: ${missing.join(", ")}`);
    console.error("Add test SMTP credentials to activity-service/.env; never commit them.");
    process.exitCode = 1;
    return;
  }
  let nodemailer;
  try { nodemailer = require("nodemailer"); }
  catch { console.error("Install optional dependency first: npm install nodemailer"); process.exitCode = 1; return; }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  const result = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO,
    subject: "PROE test email",
    text: "This is a test email from the PROE activity-service demonstration."
  });
  console.log("Test email sent:", result.messageId);
}
main().catch(err => { console.error("Email failed:", err.message); process.exitCode = 1; });
