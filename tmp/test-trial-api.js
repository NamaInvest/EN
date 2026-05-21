const http = require('http');

async function runTests() {
  console.log('--- بدء اختبارات Trial Backend Security ---');

  // Test 1: Invalid payload
  try {
    const res = await fetch('http://localhost:3000/api/desktop/trial/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const json = await res.json();
    console.log('Test 1 (Invalid Payload):', res.status === 400 && json.valid === false ? '✅' : '❌', json);
  } catch(e) { console.error('Test 1 Failed', e.message); }

  // Test 2: Invalid Token
  try {
    const res = await fetch('http://localhost:3000/api/desktop/trial/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trialToken: 'eyJzdWJkb21haW4iOiJ0ZXN0In0.invalidsig' })
    });
    const json = await res.json();
    console.log('Test 2 (Invalid Token / No Subdomain):', res.status === 400 && json.valid === false ? '✅' : '❌', json);
  } catch(e) { console.error('Test 2 Failed', e.message); }

  // Test 3: Not Found Subdomain
  try {
    const res = await fetch('http://localhost:3000/api/desktop/trial/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subdomain: 'non-existent-subdomain-123' })
    });
    const json = await res.json();
    console.log('Test 3 (Non-existent Subdomain):', res.status === 404 && json.valid === false ? '✅' : '❌', json);
  } catch(e) { console.error('Test 3 Failed', e.message); }

  console.log('--- انتهت الاختبارات ---');
}

runTests();
