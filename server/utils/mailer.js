const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,      // your Gmail address
    pass: process.env.EMAIL_APP_PASSWORD, // Gmail App Password, not your real password
  },
});

async function sendWelcomeEmail(toEmail, username) {
  await transporter.sendMail({
    from: `"Moodly" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    replyTo: process.env.EMAIL_USER,
    subject: "Welcome to Moodly",
    text: `Welcome, ${username}!\n\nYour Moodly account has been created successfully.\nStart exploring: https://smart-nearby-web.vercel.app\n\nIf you didn't create this account, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color:#4a63f5;">Welcome, ${username}!</h2>
        <p>Your Moodly account has been created successfully.</p>
        <p>Start exploring cities, collections, and your travel journal now.</p>
        <a href="https://smart-nearby-web.vercel.app" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#4a63f5;color:#fff;text-decoration:none;border-radius:8px;">
          Go to Moodly
        </a>
        <p style="font-size:12px;color:#888;margin-top:24px;">
          You're receiving this because you signed up on Moodly. If this wasn't you, ignore this email.
        </p>
      </div>
    `,
  });
}

module.exports = { sendWelcomeEmail };