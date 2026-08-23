const accountSid = 'AC532de3e736657931fbcd65fdd07e4e7c';
const authToken = '77e84a1b98b519f4553413b641800a14';
const twilioPhone = '+17372212163';
const recipientPhone = '+917983789937';

async function testCustomSMS() {
  console.log(`Sending custom branded SMS to ${recipientPhone} via Twilio Messages API...`);

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const smsText = '[Last-Mile Tracker] 🚴 Out For Delivery #ORD-98214! Vikram Singh is arriving in ~15 mins. Track live location: http://localhost:5173/customer/orders/demo';

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: recipientPhone,
        From: twilioPhone,
        Body: smsText,
      }).toString(),
    });

    const data = await res.json();
    console.log('Twilio API Status:', res.status);
    console.log('Twilio Data:', data);
  } catch (err) {
    console.error('Error sending custom SMS:', err.message);
  }
}

testCustomSMS();
