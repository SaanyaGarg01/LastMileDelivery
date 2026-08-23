require('dotenv').config();

async function testTwilioVerify() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const toPhone = '+917983789937';

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  console.log('Fetching Twilio Verify Services...');

  try {
    const res = await fetch(`https://verify.twilio.com/v2/Services`, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    const data = await res.json();
    console.log('Verify Services List:', data);

    if (data.services && data.services.length > 0) {
      const serviceSid = data.services[0].sid;
      console.log(`Sending verification SMS via Service ${serviceSid} to ${toPhone}...`);

      const vRes = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: toPhone,
          Channel: 'sms',
        }).toString(),
      });

      const vData = await vRes.json();
      console.log('Verification Status:', vRes.status, vData);
    } else {
      console.log('No Verify Service found. Creating default Verify Service...');
      const createRes = await fetch(`https://verify.twilio.com/v2/Services`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          FriendlyName: 'Last-Mile Tracker OTP',
        }).toString(),
      });

      const createData = await createRes.json();
      console.log('Created Verify Service:', createRes.status, createData);

      if (createData.sid) {
        console.log(`Sending verification SMS to ${toPhone}...`);
        const vRes = await fetch(`https://verify.twilio.com/v2/Services/${createData.sid}/Verifications`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: toPhone,
            Channel: 'sms',
          }).toString(),
        });

        const vData = await vRes.json();
        console.log('Verification Send Response:', vRes.status, vData);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testTwilioVerify();
