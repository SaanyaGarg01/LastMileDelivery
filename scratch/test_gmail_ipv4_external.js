const nodemailer = require('nodemailer');

async function testGmailExternal() {
  const targetEmail = 'saanya.23bce11295@vitbhopal.ac.in';
  console.log(`Sending Gmail IPv4 test email to external inbox: ${targetEmail}...`);

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'saanyagarg400@gmail.com',
      pass: 'qohyurvvzffqhmpf',
    },
    family: 4,
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: '"Last-Mile Tracker" <saanyagarg400@gmail.com>',
      to: targetEmail,
      subject: '[Last-Mile Tracker] Live Delivery Test',
      text: 'Live email delivery test via Gmail IPv4',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f8fafc; border-radius: 12px;">
          <h2 style="color: #0284c7;">🚀 Live Delivery Successful!</h2>
          <p>This email was delivered via Gmail SMTP IPv4 engine directly to <strong>${targetEmail}</strong>.</p>
        </div>
      `,
    });

    console.log('✅ GMAIL EXTERNAL SUCCESS! MessageID:', info.messageId);
    console.log('Response:', info.response);
  } catch (err) {
    console.error('❌ GMAIL EXTERNAL FAIL:', err.message);
  }
}

testGmailExternal();
