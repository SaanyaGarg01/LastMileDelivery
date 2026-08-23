require('dotenv').config();

async function testTemplates() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER ? process.env.TWILIO_PHONE_NUMBER.trim() : '';
  const toPhone = '+917983789937';

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const testBodies = [
    'Your verification code is 123456',
    'Your appointment is scheduled for today at 3:00 PM.',
    'Your security code is: 987654. It expires in 10 minutes.',
    'Sent from your Twilio trial account - Your security code is 123456',
  ];

  for (const bodyText of testBodies) {
    console.log(`Testing body: "${bodyText}"`);
    const body = new URLSearchParams({
      To: toPhone,
      From: fromPhone,
      Body: bodyText,
    });

    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const data = await res.json();
      console.log('HTTP Status:', res.status);
      if (res.status === 201 || res.status === 200) {
        console.log('🎉 TWILIO SMS DELIVERED SUCCESSFULLY!');
        console.log('SID:', data.sid);
        console.log('Status:', data.status);
        return;
      } else {
        console.log('Twilio error:', data.message || data.detail);
      }
    } catch (err) {
      console.error('Error:', err.message);
    }
  }
}

testTemplates();
