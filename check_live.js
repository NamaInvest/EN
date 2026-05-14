const http = require('https');
http.get('https://namainvist.com/pricing', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (data.includes('.w-full { width: 100% !important; }')) {
            console.log('HAS_CRITICAL_CSS: YES');
        } else {
            console.log('HAS_CRITICAL_CSS: NO');
        }
        if (data.includes('خطط بسيطة وشفافة 💎')) {
            console.log('HAS_NEW_CONTENT: YES');
        } else {
            console.log('HAS_NEW_CONTENT: NO');
        }
    });
});
