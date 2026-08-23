const nodemailer = require('nodemailer');

async function testGmailIPv4() {
  console.log('Testing Gmail SMTP with IPv4 force (family: 4)...');

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'saanyagarg400@gmail.com',
      pass: 'qohyurvvzffqhmpf',
    },
    family: 4, // FORCE IPV4 CONNECTION (Bypasses IPv6 blocks on Render/Linux)
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: '"Last-Mile Tracker" <saanyagarg400@gmail.com>',
      to: 'saanyagarg400@gmail.com',
      subject: '⚡ Gmail IPv4 Direct Delivery Test',
      text: 'Testing Gmail IPv4 direct delivery',
      html: '<h2>Gmail IPv4 Direct Delivery Working!</h2>',
    });

    console.log('✅ GMAIL IPV4 SUCCESS! MessageID:', info.messageId);
    console.log('Response:', info.response);
  } catch (err) {
    console.error('❌ GMAIL IPV4 FAIL:', err.message);
  }
}

testGmailIPv4();
