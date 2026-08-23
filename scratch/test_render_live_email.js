async function testRenderLiveEmail() {
  const targetUrl = 'https://lastmiledelivery-iou3.onrender.com/api/auth/register';
  const testEmail = `saanyagarg400+test${Date.now()}@gmail.com`;

  console.log(`Testing Live Render Registration Email to: ${testEmail}...`);

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'password123',
        name: 'Saanya Garg Render Live Test',
        phone: '+917983789937',
        role: 'CUSTOMER',
      }),
    });

    const data = await res.json();
    console.log('Render Live API Response Status:', res.status);
    console.log('Render Live API Data:', data);
  } catch (err) {
    console.error('Error contacting Render API:', err.message);
  }
}

testRenderLiveEmail();
