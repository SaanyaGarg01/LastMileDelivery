async function testFullUserFlow() {
  const backendUrl = 'https://lastmiledelivery-iou3.onrender.com';
  const realEmail = 'saanya.23bce11295@vitbhopal.ac.in'; // Real recipient email

  console.log(`=== TESTING FULL USER EMAIL FLOW ON RENDER ===`);
  console.log(`Target Email: ${realEmail}\n`);

  // 1. REGISTER USER
  let token = '';
  let userId = '';
  const registerEmail = `test_flow_${Date.now()}@vitbhopal.ac.in`;
  console.log(`1. Registering new customer (${registerEmail})...`);
  try {
    const regRes = await fetch(`${backendUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: registerEmail,
        password: 'Password123!',
        name: 'Saanya Real User Flow Test',
        phone: '+917983789937',
        role: 'CUSTOMER',
      }),
    });
    const regData = await regRes.json();
    console.log('   Register Response:', regRes.status, regData.message);
    token = regData.token;
    userId = regData.user?.id;
  } catch (err) {
    console.error('   Register Error:', err.message);
    return;
  }

  // 2. LOGIN USER (Triggers Sign-In Security Alert Email)
  console.log(`\n2. Logging in customer (${registerEmail})...`);
  try {
    const loginRes = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: registerEmail,
        password: 'Password123!',
      }),
    });
    const loginData = await loginRes.json();
    console.log('   Login Response:', loginRes.status, 'Token acquired:', !!loginData.token);
  } catch (err) {
    console.error('   Login Error:', err.message);
  }

  // 3. CREATE ORDER (Triggers Order Confirmed Email)
  let orderId = '';
  console.log(`\n3. Creating order for customer...`);
  try {
    const orderRes = await fetch(`${backendUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        pickupAddress: 'Sector 62, Noida, UP',
        pickupPincode: '201301',
        dropAddress: 'Connaught Place, New Delhi',
        dropPincode: '110001',
        length: 15,
        breadth: 15,
        height: 10,
        actualWeight: 2,
        orderType: 'B2C',
        paymentType: 'PREPAID',
        items: [{ name: 'Wireless Earbuds', category: 'Electronics', quantity: 1, declaredValue: 2500 }],
      }),
    });
    const orderData = await orderRes.json();
    orderId = orderData.order?.id;
    console.log('   Order Created:', orderRes.status, 'Order #:', orderData.order?.orderNumber);
  } catch (err) {
    console.error('   Order Error:', err.message);
  }

  // 4. TEST DIRECT EMAIL DISPATCH TO saanya.23bce11295@vitbhopal.ac.in
  console.log(`\n4. Sending status update email to ${realEmail}...`);
  try {
    const testRes = await fetch(`${backendUrl}/api/notifications/test-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: realEmail }),
    });
    const testData = await testRes.json();
    console.log('   Status Update Email Dispatch Response:', testData);
  } catch (err) {
    console.error('   Dispatch Error:', err.message);
  }

  console.log(`\n=== TEST COMPLETE ===`);
  console.log(`Check inbox for: ${realEmail}`);
}

testFullUserFlow();
