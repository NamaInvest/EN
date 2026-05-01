const https = require('https');
https.get('https://namainvist.com/v3', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const cssMatch = data.match(/href="(\/_next\/static\/css\/[^"]+\.css)"/);
        if (cssMatch && cssMatch[1]) {
            const cssUrl = 'https://namainvist.com' + cssMatch[1];
            console.log('Fetching', cssUrl);
            https.get(cssUrl, (res2) => {
                let cssData = '';
                res2.on('data', chunk => cssData += chunk);
                res2.on('end', () => {
                    console.log('md:flex found?', cssData.includes('md\\:flex') || cssData.includes('md:flex'));
                    console.log('lg:flex-row found?', cssData.includes('lg\\:flex-row') || cssData.includes('lg:flex-row'));
                });
            });
        } else {
            console.log('No CSS found');
        }
    });
});
