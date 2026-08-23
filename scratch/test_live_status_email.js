async function testExternalEmail() {
  const backendUrl = 'https://lastmiledelivery-iou3.onrender.com';
  const targetEmail = 'saanya.23bce11295@vitbhopal.ac.in'; // External email address

  console.log(`Sending live test email to external inbox: ${targetEmail}...`);

  try {
    const res = await fetch(`${backendUrl}/api/notifications/test-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: targetEmail }),
    });

    const data = await res.json();
    console.log('Response Status:', res.status);
    console.log('API Response:', data);
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

testExternalEmail();
