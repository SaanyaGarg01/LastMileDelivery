const accountSid = 'AC532de3e736657931fbcd65fdd07e4e7c';
const authToken = '77e84a1b98b519f4553413b641800a14';
const verifyServiceSid = 'VAe390f64a478e26aed70db9c0743901b9';
const recipientPhone = '+917983789937';

async function testTwilioDispatch() {
  console.log(`Testing Twilio SMS dispatch to ${recipientPhone}...`);

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  // Test 1: Messages API
  console.log('Test 1: Calling Twilio Messages API...');
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: recipientPhone,
        From: '+17372212163',
        Body: '[Last-Mile Tracker] 📦 Test SMS notification!',
      }).toString(),
    });
    const data = await res.json();
    console.log('   Messages API Status:', res.status, res.ok ? '✅ OK' : '❌ FAIL');
    console.log('   Response Data:', data);
  } catch (err) {
    console.error('   Messages API Error:', err.message);
  }

  // Test 2: Verify API
  console.log('\nTest 2: Calling Twilio Verify API...');
  try {
    const res = await fetch(`https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: recipientPhone,
        Channel: 'sms',
      }).toString(),
    });
    const data = await res.json();
    console.log('   Verify API Status:', res.status, res.ok ? '✅ OK' : '❌ FAIL');
    console.log('   Response Data:', data);
  } catch (err) {
    console.error('   Verify API Error:', err.message);
  }
}

testTwilioDispatch();
