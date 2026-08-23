require('dotenv').config();
// Use Brevo REST API directly via fetch (no SDK quirks)
async function testBrevoApi() {
  const apiKey = process.env.BREVO_API_KEY;

  const sendEmail = async (to, toName, subject) => {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Last-Mile Tracker', email: 'saanyagarg400@gmail.com' },
        to: [{ email: to, name: toName }],
        subject,
        htmlContent: `<h2 style="color:#6366f1">🎉 Brevo Works for ANY Email!</h2><p>Sent to: <strong>${to}</strong></p><p>Last-Mile Tracker email notifications are now working for every user!</p>`,
        textContent: `Brevo API email to ${to} - Last-Mile Tracker`,
      }),
    });
    const data = await res.json();
    return { status: res.status, data };
  };

  // Test 1: Different email (college)
  console.log('Test 1: saanya.23bce11295@vitbhopal.ac.in ...');
  const r1 = await sendEmail('saanya.23bce11295@vitbhopal.ac.in', 'Saanya VIT', '[Last-Mile Tracker] Brevo API - Any Email Test!');
  if (r1.status === 201) {
    console.log('✅ SUCCESS! MessageID:', r1.data.messageId);
  } else {
    console.error('❌ FAIL:', r1.status, JSON.stringify(r1.data));
  }

  // Test 2: Gmail
  console.log('\nTest 2: saanyagarg400@gmail.com ...');
  const r2 = await sendEmail('saanyagarg400@gmail.com', 'Saanya Gmail', '[Last-Mile Tracker] Brevo API - Gmail Test!');
  if (r2.status === 201) {
    console.log('✅ SUCCESS! MessageID:', r2.data.messageId);
  } else {
    console.error('❌ FAIL:', r2.status, JSON.stringify(r2.data));
  }
}

testBrevoApi();
