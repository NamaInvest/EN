const https = require('https');
https.get('https://n2.namainvist.com/login', {
    headers: {
        'User-Agent': 'Mozilla/5.0'
    }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const matches = data.match(/static\/chunks\/[^"]+/g);
        if (matches) {
            console.log("Chunks loaded by HTML:");
            matches.forEach(m => console.log(m));
        } else {
            console.log("No chunks found in HTML.");
        }
    });
});
