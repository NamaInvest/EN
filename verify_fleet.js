const {Client} = require('ssh2');
const c = new Client();
c.on('ready', () => {
    console.log('Connected — Testing on CORRECT ports\n');
    const tests = [
        // n11 (saas-app) = port 3500 — the actual ERP
        { name: '🟢 n11:3500 Login', cmd: `curl -s -m 5 -X POST http://localhost:3500/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"O_O772040030"}' 2>&1 | head -c 300` },
        { name: '🟢 n11:3500 Delivery Platforms', cmd: 'curl -s -m 5 http://localhost:3500/api/delivery-platforms 2>&1 | head -c 300' },
        { name: '🟢 n11:3500 Shipments', cmd: 'curl -s -m 5 http://localhost:3500/api/shipments 2>&1 | head -c 300' },
        { name: '🟢 n11:3500 Contract Alerts', cmd: 'curl -s -m 5 http://localhost:3500/api/contracts/alerts 2>&1 | head -c 300' },
        { name: '🟢 n11:3500 BI Export', cmd: 'curl -s -m 5 http://localhost:3500/api/reports/bi-export?entity=inventory 2>&1 | head -c 300' },
        { name: '🟢 n11:3500 Report Export', cmd: 'curl -s -m 5 -o /dev/null -w "HTTP %{http_code}" http://localhost:3500/api/reports/export?type=trial-balance 2>&1' },
        // n7 (saas-dev) = port 3600
        { name: '🔵 n7:3600 Login', cmd: `curl -s -m 5 -X POST http://localhost:3600/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"O_O772040030"}' 2>&1 | head -c 300` },
        { name: '🔵 n7:3600 Delivery Platforms', cmd: 'curl -s -m 5 http://localhost:3600/api/delivery-platforms 2>&1 | head -c 300' },
        // main-site = port 3000 (landing page)
        { name: '🟡 main:3000 Home', cmd: 'curl -s -m 5 -o /dev/null -w "HTTP %{http_code}" http://localhost:3000/ 2>&1' },
        // Check files on n11
        { name: '📂 n11 files check', cmd: 'ls /www/wwwroot/n11.namainvist.com/src/lib/totp.ts /www/wwwroot/n11.namainvist.com/src/app/api/shipments/route.ts /www/wwwroot/n11.namainvist.com/src/app/api/delivery-platforms/route.ts 2>&1' },
        // DB check on n11's database
        { name: '📦 n11 DB env', cmd: 'grep DATABASE_URL /www/wwwroot/n11.namainvist.com/.env 2>&1' },
    ];
    let i = 0;
    function next() {
        if (i >= tests.length) { c.end(); return; }
        const t = tests[i++];
        c.exec(t.cmd, (err, stream) => {
            if (err) { console.log(`❌ ${t.name}: ${err.message}`); next(); return; }
            let out = '';
            stream.on('data', d => out += d.toString());
            stream.stderr.on('data', d => out += d.toString());
            stream.on('close', () => {
                console.log(`${t.name}:`);
                console.log(`   ${out.trim().substring(0, 300)}`);
                console.log('');
                next();
            });
        });
    }
    next();
});
c.on('error', e => console.error(e.message));
c.connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:15000});
