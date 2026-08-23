async function diagnoseRender() {
  const base = 'https://lastmiledelivery-iou3.onrender.com';
  
  // 1. Check health - see if RESEND_API_KEY is loaded
  console.log('1. Checking /api/health...');
  try {
    const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(15000) });
    const data = await res.json();
    console.log('   Email Service:', JSON.stringify(data.services?.emailService, null, 4));
  } catch (e) {
    console.log('   ERROR:', e.message);
  }

  // 2. Test email endpoint
  console.log('\n2. Testing /api/notifications/test-email...');
  try {
    const res = await fetch(`${base}/api/notifications/test-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'saanyagarg400@gmail.com' }),
      signal: AbortSignal.timeout(30000),
    });
    const data = await res.json();
    console.log('   Status:', res.status, data);
  } catch (e) {
    console.log('   ERROR (timeout or connection refused):', e.message);
  }
}
diagnoseRender();
