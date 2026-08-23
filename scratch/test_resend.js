require('dotenv').config();
const { Resend } = require('resend');

async function testResend() {
  const apiKey = process.env.RESEND_API_KEY;
  console.log('RESEND_API_KEY loaded:', apiKey ? `✅ ${apiKey.substring(0, 10)}...` : '❌ MISSING');

  const resend = new Resend(apiKey);

  console.log('\nSending test email via Resend API...');
  try {
    const { data, error } = await resend.emails.send({
      from: 'Last-Mile Tracker <onboarding@resend.dev>',
      to: ['saanyagarg400@gmail.com'],
      subject: '✅ Resend API Working — Last-Mile Tracker',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
          <h2 style="color:#6366f1;">🎉 Email Delivery Working!</h2>
          <p>Your Last-Mile Tracker app is now sending emails via <strong>Resend API</strong>.</p>
          <p>This means emails from <strong>registration, login alerts, and order status updates</strong> will now arrive in your inbox!</p>
          <hr/>
          <p style="color:#64748b;font-size:12px;">Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
      text: 'Resend API is working! Last-Mile Tracker emails will now be delivered.',
    });

    if (error) {
      console.error('❌ Resend error:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Resend SUCCESS! Email ID:', data.id);
      console.log('Check your inbox: saanyagarg400@gmail.com');
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

testResend();
