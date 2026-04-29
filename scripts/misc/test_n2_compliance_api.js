const https = require('https');

const req = https.request({
    hostname: 'n2.namainvist.com',
    port: 443,
    path: '/api/zatca',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
}, (res) => {
    let raw = '';
    res.on('data', c => raw += c);
    res.on('end', () => console.log('ZATCA CSID TEST RESULT:', raw));
});

req.on('error', e => console.log(e));
req.write(JSON.stringify({ action: "compliance-csid", otp: "123345" }));
req.end();
