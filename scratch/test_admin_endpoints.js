async function testAdminEndpoints() {
  const backendUrl = 'https://lastmiledelivery-iou3.onrender.com';
  console.log('Testing Admin Endpoints on Live Server...');

  // 1. Live Operations
  try {
    const res = await fetch(`${backendUrl}/api/admin/live-operations`);
    const data = await res.json();
    console.log('1. Live Operations:', res.status, data.success ? '✅ SUCCESS' : '❌ FAIL');
  } catch (err) {
    console.error('1. Live Operations Error:', err.message);
  }

  // 2. Risk Radar
  try {
    const res = await fetch(`${backendUrl}/api/admin/risk-radar`);
    const data = await res.json();
    console.log('2. Risk Radar:', res.status, data.success ? '✅ SUCCESS' : '❌ FAIL');
  } catch (err) {
    console.error('2. Risk Radar Error:', err.message);
  }

  // 3. Operations Health
  try {
    const res = await fetch(`${backendUrl}/api/admin/operations-health`);
    const data = await res.json();
    console.log('3. Operations Health:', res.status, data.success ? '✅ SUCCESS' : '❌ FAIL');
  } catch (err) {
    console.error('3. Operations Health Error:', err.message);
  }

  // 4. Support Tickets
  try {
    const res = await fetch(`${backendUrl}/api/admin/support/tickets`);
    const data = await res.json();
    console.log('4. Support Tickets:', res.status, data.success ? '✅ SUCCESS' : '❌ FAIL');
  } catch (err) {
    console.error('4. Support Tickets Error:', err.message);
  }
}

testAdminEndpoints();
