const https = require('https');

function testEndpoint(version, model, key) {
    return new Promise((resolve) => {
        const payload = JSON.stringify({
            contents: [{ parts: [{ text: "Hello" }] }]
        });
        
        const req = https.request(`https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`[${version}] [${model}] -> Status: ${res.statusCode}`);
                if (res.statusCode !== 200) {
                    console.log(`Error: ${JSON.parse(data).error?.message}\n`);
                } else {
                    console.log(`✅ SUCCESS!\n`);
                }
                resolve();
            });
        });
        req.on('error', (e) => resolve());
        req.write(payload);
        req.end();
    });
}

async function run() {
    const key = 'AIzaSyCY2NBRvTazcdUnqqv1roMFGGX3LQ1qJkA';
    await testEndpoint('v1beta', 'gemini-1.5-flash', key);
    await testEndpoint('v1beta', 'gemini-1.5-pro', key);
    await testEndpoint('v1', 'gemini-1.5-flash', key);
    await testEndpoint('v1', 'gemini-1.5-pro', key);
}
run();
