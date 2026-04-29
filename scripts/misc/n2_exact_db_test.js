const https = require('https');

function doFetch(host, path, b64, otp) {
    return new Promise((resolve) => {
        const postData = JSON.stringify({ csr: b64 });
        const req = https.request({
            hostname: host, port: 443, path: path, method: 'POST',
            headers: {
                'Accept': 'application/json', 'Accept-Version': 'V2', 'Accept-Language': 'en',
                'OTP': otp, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData)
            }
        }, res => {
            let data = ''; res.on('data', c => data+=c);
            res.on('end', () => resolve({status: res.statusCode, body: data}));
        });
        req.on('error', e => resolve({status: 500, body: e.message}));
        req.write(postData); req.end();
    });
}

async function run() {
    // This is the EXACT string from the Database
    const dbValue = 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0KTUlJQ0RqQ0NBYlFDQVFBd0daY3hDekFKQmdOVkJBWVRBaE5CTVJFd0R3WURWUVFMREFoSVpXRmtT\nRzl1Ym1WeE1SOHdIUVlEVlFRS0RCSktRVTFCSUVOdmJYQmhibmt4SVRBZkJnTlZCQU1NR0RNeE1UazQ\n1TmpJd056QXdNREF6TUZrd0V3WUhLb1pJemowQ0FRWUlLb1pJemowREFRY0RRZ0FFU3hOSUpIcU5o\ndzIwcExEWWFwSE9XMWRCV1lkMkpOMUNwbmk3QzJzclQwaFllakdUMXVOSXBYM1EwcXgxaVBybm5C\nSjJkYW5vK3cxcTh0eTJjTVhIeXFLUmdUQ0JuZ1lKS29aSWh2Y05BUWtPTVFZdzZqQXRCZ05WSFJF\nRU1pNHdrV1F4TFRFMFQxTXZNUXBsYkhWbktETXREalk0TWpFMUxUSmhZMkUxTFVRdG1qbGtNRE10\nTVRKbVpHSmxPR2RrWm1Zd2ZnWURWUVIwQkE4d01EQXdPellERlEwaVlTNDBMamVwTUNzeGNXRndk\nSFJwYm05MllXMTVjbTkwYzNSMVpEQWJCZ2txaGtpRzl3MEJDUUF4TXpBcU1DZ0dDZ3NxR1NJYjNE\nUUVKQXhNWk1qVXhNelEzT1RJME5EWXdUQWdCQncyRmNYQndjSGs4TUQwR0NXT0dRc2FjRENRQXdU\nQWdCQncyRmNYQndjSGs4TUEwR0NXT0dRc2FjRENRUXdUQWdCQncyRmNYQndjSGs4TUQBR0NXT0dR\nc2FjRENRVXdUQWdCQncyRmNYQndjSGs4TUEwR0NXT0dRc2FjRERRQXdUQWdCQncyRmNYQndjSGs4\nTUQwR0NXT0dRc2FjRERRWXdNQUFvSUJaQ0FHQW1vRFlaUXR6ZzhnZnhNUDJvZEZCMUpHdnBDNUY\n5NE95SjU4cUhKUEhlb01pSTc1bm1PZytIN0g4eDBOTXhTMEdXOU4yME4wb3Z3NEs5N1ZpMDQyVnZ\neExHRE1tZEFhOU9aSHZONnpWdjhkZ3Q3OHByMTRNckNoVjhxVUdYUE0xclBwbHNvUTZwd1FTUW1\nY3g2b1E2MEtiK1BvPT0KLS0tLS1FTkQgQ0VSVElGSUNBVEUgUkVRVUVTVC0tLS0tCg==';

    console.log('Sending exact DB CSR to Core Portal:', dbValue.substring(0, 50));
    
    console.log('[Core] ', (await doFetch('gw-fatoora.zatca.gov.sa', '/e-invoicing/core/compliance', dbValue, '123345')).body.slice(0,150));
}
run();
