const http = require('http');

console.log("Starting NamaVest Universal Automation Daemon...");

function triggerCron(path) {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: 'POST',
    };

    const req = http.request(options, (res) => {
        let result = '';
        res.on('data', d => { result += d; });
        res.on('end', () => {
            console.log(`[${new Date().toISOString()}] CRON ${path}: ${res.statusCode} - ${result.substring(0, 100)}`);
        });
    });

    req.on('error', (e) => {
        console.error(`[${new Date().toISOString()}] CRON FAILED ${path}: ${e.message}`);
    });
    req.end();
}

// Initialize instantly upon reboot or startup
triggerCron('/api/cron/debts');
triggerCron('/api/cron/hr');
triggerCron('/api/cron/shifts');
triggerCron('/api/cron/trigger-invoices');

// Ping sequentially every 6 hours (21,600,000 milliseconds)
setInterval(() => {
    triggerCron('/api/cron/debts');
    triggerCron('/api/cron/hr');
    triggerCron('/api/cron/shifts');
    triggerCron('/api/cron/trigger-invoices');
}, 6 * 60 * 60 * 1000);
