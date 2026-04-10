const https = require('https');

https.get('https://n11.namainvist.com/settings', (res) => {
    let chunks = [];
    res.on('data', d => chunks.push(d));
    res.on('end', () => {
        const html = Buffer.concat(chunks).toString();
        const idx = html.indexOf('Hindi');
        console.log('HTML around Hindi:', html.slice(Math.max(0, idx - 100), idx + 200));
    });
});
