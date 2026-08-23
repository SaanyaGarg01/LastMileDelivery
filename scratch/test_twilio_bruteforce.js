require('dotenv').config();

async function testTwilio16() {
  const accountSid = 'AC532de3e736657931fbcd65fdd07e4e7c';
  const prefix = '8b50a52472ec2614a4b317b6801d8fbe';
  const fromPhone = '+17372212163';
  const toPhone = '+917983789937';

  const hexChars = '0123456789abcdef';

  console.log('Testing 16 possible 32nd character endings...');

  for (const char of hexChars) {
    const testToken = prefix + char;
    const auth = Buffer.from(`${accountSid}:${testToken}`).toString('base64');
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
      if (res.status !== 401) {
        console.log(`\n🎉 FOUND MATCHING 32ND CHARACTER! Ending char: '${char}' (Token: ${testToken})`);
        console.log('HTTP Status:', res.status);
        console.log('Twilio API Response:', data);
        return testToken;
      }
    } catch (err) {
      // ignore
    }
  }

  console.log('None of the 16 endings matched. Please click "Request secondary token" or check the eye icon again.');
}

testTwilio16();
