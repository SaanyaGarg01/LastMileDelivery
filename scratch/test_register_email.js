async function testRegisterEmail() {
  const testEmail = `saanya.test.${Date.now()}@gmail.com`;
  console.log(`Testing Registration with email: ${testEmail}...`);

  try {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'password123',
        name: 'Saanya Garg',
        phone: '+917983789937',
        role: 'CUSTOMER',
      }),
    });

    const data = await res.json();
    console.log('Response:', data);
  } catch (err) {
    console.error('❌ Registration failed:', err.message);
  }
}

testRegisterEmail();
