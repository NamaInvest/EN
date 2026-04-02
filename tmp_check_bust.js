const https = require('https');
https.get('https://n2.namainvist.com/login?v=mukhtarcachebust123', {
    headers: {
        'User-Agent': 'Mozilla/5.0'
    }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log("Does HTML contain 32c125d888be6da5?", data.includes('32c125d888be6da5'));
        console.log("Does HTML contain MUKHTAR?", data.includes('MUKHTAR'));
        if (!data.includes('32c1')) {
             const m = data.match(/static\/chunks\/[a-z0-9]+\.js/g);
             console.log("Chunks instead:", m && m.slice(0, 5));
        }
    });
});
