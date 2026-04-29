const https = require('https');
const zlib = require('zlib');

https.get('https://n11.namainvist.com/settings', {
    headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'Mozilla/5.0'
    }
}, (res) => {
    let chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => {
        let buffer = Buffer.concat(chunks);
        let encoding = res.headers['content-encoding'];
        console.log('Encoding:', encoding);
        let html = '';
        if (encoding === 'gzip') {
            html = zlib.unzipSync(buffer).toString();
        } else if (encoding === 'br') {
            html = zlib.brotliDecompressSync(buffer).toString();
        } else {
            html = buffer.toString();
        }
        
        let scripts = html.match(/src="([^"]+\.js)"/g) || [];
        console.log('Scripts:', scripts.slice(0, 5));
        
        // Find if any script contains Hindi (to grab the i18n chunk hash)
        console.log('Total scripts found:', scripts.length);
        
        const settingsScripts = scripts.filter(s => s.includes('settings'));
        console.log('Settings scripts:', settingsScripts);
    });
}).on('error', err => console.log(err));
