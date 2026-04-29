const https = require('https');
const http = require('http');

const runCurl = () => {
    https.get('https://n11.namainvist.com/settings', (res) => {
        let chunks = [];
        res.on('data', d => chunks.push(d));
        res.on('end', () => {
            const html = Buffer.concat(chunks).toString();
            // Look for Hindi
            if (html.includes('Hindi') || html.includes('sys.str_4390')) {
                console.log('NGINX RETURNED OLD DATA IN HTML', html.indexOf('Hindi'), html.indexOf('sys.str_4390'));
            } else {
                console.log('HTML is clean of Hindi and raw sys.str codes!');
                // Check if ar or en are there
                console.log('Arabic exists?', html.includes('Arabic'));
                console.log('Company Info Arabic:', html.includes('معلومات المنشأة'));
            }
            
            // Output length
            console.log('HTML Length:', html.length);
        });
    });
};

runCurl();
