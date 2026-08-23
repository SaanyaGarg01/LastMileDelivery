require('dotenv').config();
const nodemailer = require('nodemailer');

async function testGmail() {
  console.log('Testing Gmail SMTP with user credentials:');
  console.log('Host:', process.env.SMTP_HOST || 'smtp.gmail.com');
  console.log('User:', process.env.SMTP_USER);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '',
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Last-Mile Tracker" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send test email to self
      subject: '[Last-Mile Tracker] Test Email Verification',
      text: 'Congratulations! Your Gmail SMTP integration with Last-Mile Delivery Tracker is working 100% cleanly.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #0f172a; color: white; border-radius: 12px;">
          <h2 style="color: #38bdf8;">🚚 Last-Mile Delivery Tracker</h2>
          <p>This is a real verification email sent from your Node.js backend using Gmail SMTP.</p>
          <p style="color: #4ade80; font-weight: bold;">Status: DELIVERED SUCCESSFUL</p>
        </div>
      `,
    });

    console.log('✅ GMAIL TEST SUCCESSFUL!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  } catch (err) {
    console.error('❌ GMAIL TEST FAILED!');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
  }
}

testGmail();
