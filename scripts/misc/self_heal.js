const https = require('https');
const { Client } = require('ssh2');

const NODES = [
    { url: 'https://n1.namainvist.com', host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', name: 'N1' },
    // Only demonstrating N1 for POC
];

const CHECK_INTERVAL = 60000; // 1 minute
const TIMEOUT = 5000; // 5 seconds

function pingNode(node) {
    return new Promise((resolve) => {
        const req = https.get(node.url, { timeout: TIMEOUT }, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 400) {
                resolve(true); // healthy
            } else {
                resolve(false); // unhealthy status code
            }
        }).on('error', () => {
            resolve(false); // connection error or timeout
        }).on('timeout', () => {
            req.destroy();
            resolve(false);
        });
    });
}

function healNode(node) {
    return new Promise((resolve) => {
        console.log(\`[🏥 Self-Heal] Initiating CPR on \${node.name} (\${node.host})...\`);
        const conn = new Client();
        conn.on('ready', () => {
            conn.exec('pm2 restart all', (err, stream) => {
                if (err) {
                    console.error(\`[🚨 Self-Heal Failed] Could not restart PM2 on \${node.name}: \`, err);
                    return resolve(false);
                }
                stream.on('close', () => {
                    console.log(\`[✅ Self-Heal Success] \${node.name} has been resuscitated.\`);
                    conn.end();
                    resolve(true);
                });
            });
        }).on('error', (err) => {
            console.error(\`[🚨 Self-Heal Failed] SSH unreachable on \${node.name}: \`, err.message);
            resolve(false);
        }).connect(node);
    });
}

async function startMonitor() {
    console.log('🤖 Self-Healing Agent Started. Monitoring Nodes...');
    setInterval(async () => {
        for (const node of NODES) {
            const isHealthy = await pingNode(node);
            if (!isHealthy) {
                console.log(\`[⚠️ Alert] Node \${node.name} is down! Triggering auto-recovery...\`);
                await healNode(node);
            } else {
                console.log(\`[💚 Heartbeat] Node \${node.name} is healthy.\`);
            }
        }
    }, CHECK_INTERVAL);
}

startMonitor();
