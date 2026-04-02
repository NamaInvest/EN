const https = require('https');
const http = require('http');

// Check what N3-N10 actually serve
const nodes = [1, 3, 5, 7, 10];

async function checkNode(n) {
    return new Promise((resolve) => {
        const url = `https://n${n}.namainvist.com`;
        const req = https.get(url, { timeout: 10000, rejectUnauthorized: false }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                // Check if sys.str_ keys appear in the HTML
                const sysStrMatches = body.match(/sys\.str_\d+/g);
                const hasSysStr = sysStrMatches ? sysStrMatches.slice(0, 5) : [];
                const hasTranslated = body.includes('نما') || body.includes('الرئيسية');
                const statusCode = res.statusCode;
                
                console.log(`N${n}: Status=${statusCode}, HasTranslations=${hasTranslated}, RawKeys=${hasSysStr.length > 0 ? hasSysStr.join(', ') : 'NONE'}`);
                resolve();
            });
        });
        req.on('error', (e) => {
            console.log(`N${n}: ERROR - ${e.message}`);
            resolve();
        });
        req.on('timeout', () => {
            console.log(`N${n}: TIMEOUT`);
            req.destroy();
            resolve();
        });
    });
}

(async () => {
    console.log('Checking live pages for raw translation keys...\n');
    for (const n of nodes) {
        await checkNode(n);
    }
})();
