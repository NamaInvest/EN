/**
 * Test all new APIs on Fleet Server from inside
 */
const { Client } = require('ssh2');
const HOST = '46.4.188.170';
const PASSWORD = 'process.env.SSH_PASSWORD';

const TESTS = [
    { name: 'Delivery Platforms (GET)', cmd: 'curl -s http://localhost:3001/api/delivery-platforms' },
    { name: 'BI Export - Inventory (GET)', cmd: 'curl -s http://localhost:3001/api/reports/bi-export?entity=inventory' },
    { name: 'Report Export - Trial Balance (GET)', cmd: 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/reports/export?type=trial-balance' },
    { name: 'Shipments (GET)', cmd: 'curl -s http://localhost:3001/api/shipments' },
    { name: '2FA Setup (GET check)', cmd: 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/auth/2fa/setup' },
    { name: 'Contract Alerts (GET)', cmd: 'curl -s http://localhost:3001/api/contracts/alerts' },
    { name: 'Delivery Webhook (POST)', cmd: `curl -s -X POST http://localhost:3001/api/delivery-platforms?platform=jahez -H 'Content-Type: application/json' -d '{"order_id":"TEST-001","items":[{"name":"burger","qty":2}]}'` },
    { name: 'Main Site - Delivery (GET)', cmd: 'curl -s http://localhost:3000/api/delivery-platforms' },
    { name: 'PM2 Status', cmd: 'pm2 jlist | node -e "process.stdin.on(\"data\",d=>{const a=JSON.parse(d);a.forEach(p=>console.log(p.name+\": \"+p.pm2_env.status))})"' },
];

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected — Running API tests on fleet server\n');
    
    let i = 0;
    function runNext() {
        if (i >= TESTS.length) { conn.end(); return; }
        const test = TESTS[i++];
        conn.exec(test.cmd, (err, stream) => {
            if (err) { console.log(`❌ ${test.name}: exec error`); runNext(); return; }
            let out = '';
            stream.on('data', (d) => out += d.toString());
            stream.stderr.on('data', (d) => out += d.toString());
            stream.on('close', () => {
                const short = out.trim().substring(0, 200);
                console.log(`${test.name}:`);
                console.log(`  ${short}`);
                console.log('');
                runNext();
            });
        });
    }
    runNext();
});
conn.on('error', (err) => console.error('Error:', err.message));
conn.connect({ host: HOST, port: 22, username: 'root', password: PASSWORD, readyTimeout: 15000 });
