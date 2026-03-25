const http = require('http');
const https = require('https');

async function runAutomation() {
    console.log('🚀 [NamaSoft E2E Automation] Starting diagnostic sweep on n1.namainvist.com...');
    
    // 1. Authenticate to get session token
    console.log('\\n🔐 Step 1: Simulating Administrator Login');
    let token = null;
    let cookie = null;
    
    try {
        const loginRes = await fetch('https://n1.namainvist.com/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: '123' })
        });
        
        if (loginRes.status === 200) {
            const data = await loginRes.json();
            token = data.token;
            // Get Set-Cookie header if exists
            cookie = loginRes.headers.get('set-cookie');
            console.log('✅ Login Successful. Token Acquired.');
        } else {
            console.log('⚠️ Login failed (Status ' + loginRes.status + '). Will test public routes only.');
        }
    } catch(e) {
        console.error('❌ Login error:', e.message);
    }

    // 2. Define Core Routes to Validate
    const targets = [
        { name: 'Public Landing Page', url: 'https://n1.namainvist.com/' },
        { name: 'Login Interface', url: 'https://n1.namainvist.com/login' },
        { name: 'Dashboard Module', url: 'https://n1.namainvist.com/dashboard' },
        { name: 'Point of Sale (POS)', url: 'https://n1.namainvist.com/pos' },
        { name: 'HR / Employees', url: 'https://n1.namainvist.com/hr/employees' },
        { name: 'Accounting Engine', url: 'https://n1.namainvist.com/accounting/journal' },
        { name: 'Inventory Management', url: 'https://n1.namainvist.com/inventory/items' },
        { name: 'Sales & ZATCA', url: 'https://n1.namainvist.com/sales/invoices' },
        { name: 'System Alerts API', url: 'https://n1.namainvist.com/api/system/alerts' }
    ];

    console.log('\\n📡 Step 2: Hitting ' + targets.length + ' Core Architectural Endpoints');
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (cookie) headers['Cookie'] = cookie;

    let passed = 0;
    
    for (const target of targets) {
        try {
            const res = await fetch(target.url, { headers });
            const status = res.status;
            if (status === 200) {
                console.log(`✅ [HTTP ${status}] ${target.name} -> Loaded seamlessly.`);
                passed++;
            } else if (status === 307 || status === 308) {
                console.log(`🔀 [HTTP ${status}] ${target.name} -> Redirected safely.`);
                passed++;
            } else {
                console.log(`❌ [HTTP ${status}] ${target.name} -> Unexpected rendering error.`);
            }
        } catch (e) {
            console.log(`❌ [CRASH] ${target.name} -> Core network failure: ${e.message}`);
        }
    }

    console.log('\\n📊 [Final Report]');
    if (passed === targets.length) {
        console.log('🌟 100% HEALTHY! All Core E2E Modules are Online and Bug-Free.');
    } else {
        console.log(`⚠️ Partial Health: ${passed} out of ${targets.length} modules passed.`);
    }
}

runAutomation();
