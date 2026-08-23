require('dotenv').config();

async function testTwilioSMS() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;
  const toPhone = '+917983789937'; // User's mobile number

  console.log('Testing Twilio REST SMS dispatch:');
  console.log('Account SID:', accountSid);
  console.log('From Phone:', fromPhone);
  console.log('To Phone:', toPhone);

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const body = new URLSearchParams({
    To: toPhone,
    From: fromPhone,
    Body: 'Last-Mile Tracker Test SMS: Your production Twilio SMS integration is working!',
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
    console.log('Twilio API Response:', data);
  } catch (err) {
    console.error('Fetch Error:', err.message);
  }
}

testTwilioSMS();
