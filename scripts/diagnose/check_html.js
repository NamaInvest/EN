const https = require('https');

// First login to get token
const loginData = JSON.stringify({ username: 'admin', password: 'admin123' });
const loginOptions = {
    hostname: 'n11.namainvist.com',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
    }
};

console.log('Logging in...');
const req = https.request(loginOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Login response:', res.statusCode, data.slice(0, 200));
        try {
            const parsed = JSON.parse(data);
            const token = parsed.token;
            if (!token) {
                console.log('No token, trying default...');
                checkSettings('fallback-token');
                return;
            }
            console.log('Got token:', token.slice(0, 30) + '...');
            checkSettings(token);
        } catch(e) {
            console.log('Parse error:', e.message);
            checkSettings('fallback-token');
        }
    });
});

req.on('error', (e) => { console.error('Login error:', e); });
req.write(loginData);
req.end();

function checkSettings(token) {
    // Now try to fetch the settings page with auth
    const options = {
        hostname: 'n11.namainvist.com',
        port: 443,
        path: '/settings',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Cookie': `token=${token}`,
            'Accept': 'text/html,application/xhtml+xml',
            'User-Agent': 'Mozilla/5.0'
        }
    };
    
    console.log('Fetching settings page...');
    const req2 = https.get(options, (res2) => {
        let html = '';
        res2.on('data', (chunk) => { html += chunk; });
        res2.on('end', () => {
            console.log('Status:', res2.statusCode);
            // Settings page is 'use client' so HTML will be minimal - just check for sys.str
            const hasSysStr = html.includes('sys.str_4390');
            const hasArabic = html.includes('معلومات المنشأة');
            console.log('HTML contains sys.str_4390:', hasSysStr);
            console.log('HTML contains Arabic trans:', hasArabic);
            // The HTML from a client component won't have the translated content since it's JS-rendered
            // But we can check that the chunk is referenced
            const chunkRef = html.match(/\/_next\/static\/chunks\/[a-f0-9]+\.js/g);
            console.log('Referenced chunks:', chunkRef?.slice(0, 5));
        });
    });
    req2.on('error', (e) => { console.error('Settings fetch error:', e); });
}
