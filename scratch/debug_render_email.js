// Debug script: Tests what env vars Render has and whether Gmail actually works
// Run: node scratch/debug_render_email.js

async function debugRenderEmail() {
  const baseUrl = 'https://lastmiledelivery-iou3.onrender.com';

  console.log('=== RENDER LIVE EMAIL DIAGNOSTIC ===\n');

  // 1. Test the public test-email endpoint directly
  console.log('1. Testing /api/notifications/test-email ...');
  try {
    const res = await fetch(`${baseUrl}/api/notifications/test-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'saanyagarg400@gmail.com' }),
    });
    const data = await res.json();
    console.log('   Status:', res.status, data);
  } catch (e) {
    console.log('   ERROR:', e.message);
  }

  // 2. Register a fresh user and watch what happens
  const ts = Date.now();
  const testEmail = `saanya.render.${ts}@gmail.com`;
  console.log(`\n2. Registering new user: ${testEmail} ...`);
  try {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Test1234!',
        name: 'Render Diag User',
        phone: '+917983789937',
        role: 'CUSTOMER',
      }),
    });
    const data = await res.json();
    console.log('   HTTP Status:', res.status);
    console.log('   Response:', JSON.stringify(data, null, 2));

    if (data.token) {
      // 3. Now place an order
      console.log(`\n3. Placing order for ${testEmail}...`);
      const orderRes = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.token}`,
        },
        body: JSON.stringify({
          pickupAddress: 'Connaught Place, Central Delhi',
          pickupPincode: '110001',
          dropAddress: 'Sector 18, Noida',
          dropPincode: '201301',
          length: 20,
          breadth: 15,
          height: 10,
          actualWeight: 2.5,
          orderType: 'B2C',
          paymentType: 'PREPAID',
          items: [{ name: 'Test Item', category: 'Electronics', quantity: 1, declaredValue: 1000 }],
        }),
      });
      const orderData = await orderRes.json();
      console.log('   Order HTTP Status:', orderRes.status);
      console.log('   Order:', JSON.stringify(orderData?.order?.orderNumber));
    }
  } catch (e) {
    console.log('   ERROR:', e.message);
  }

  console.log('\n=== CHECK YOUR EMAIL INBOX AND SPAM NOW ===');
  console.log('Also check Render logs at https://dashboard.render.com for any [GMAIL] lines');
}

debugRenderEmail();
