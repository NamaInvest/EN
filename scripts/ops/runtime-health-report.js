const https = require('https');

const ENDPOINTS = [
    { url: 'https://namainvist.com', expectedStatus: 200, label: 'Main Website' },
    { url: 'https://n1.namainvist.com', expectedStatus: 200, label: 'Tenant Landing Page' },
    { url: 'https://n11.namainvist.com', expectedStatus: 200, label: 'SaaS App Base' },
    { url: 'https://namainvist.com/api/admin/tenant-provisioning/approve', expectedStatus: 401, label: 'Protected Admin Approve API' }
];

function checkUrl(endpoint) {
    return new Promise((resolve) => {
        const start = Date.now();
        const req = https.get(endpoint.url, { rejectUnauthorized: false, timeout: 5000 }, (res) => {
            const duration = Date.now() - start;
            resolve({
                url: endpoint.url,
                label: endpoint.label,
                statusCode: res.statusCode,
                durationMs: duration,
                ok: res.statusCode === endpoint.expectedStatus
            });
        });
        
        req.on('error', (err) => {
            resolve({
                url: endpoint.url,
                label: endpoint.label,
                statusCode: null,
                durationMs: Date.now() - start,
                ok: false,
                error: err.message
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve({
                url: endpoint.url,
                label: endpoint.label,
                statusCode: null,
                durationMs: 5000,
                ok: false,
                error: 'TIMEOUT'
            });
        });
    });
}

async function runHealthReport() {
    const results = [];
    for (const ep of ENDPOINTS) {
        results.push(await checkUrl(ep));
    }
    
    const overallSuccess = results.every(r => r.ok);
    return {
        timestamp: new Date().toISOString(),
        overallSuccess,
        results
    };
}

if (require.main === module) {
    runHealthReport()
        .then(report => {
            console.log('--- RUNTIME_HEALTH_REPORT ---');
            console.log(JSON.stringify(report, null, 2));
        })
        .catch(err => {
            console.error('Failed to run runtime health report:', err.message);
            process.exit(1);
        });
}

module.exports = { runHealthReport };
