const {Client} = require('ssh2');
const c = new Client();
function exec(conn, cmd) {
    return new Promise((resolve) => {
        conn.exec(cmd, (err, stream) => {
            if (err) { resolve('ERROR: ' + err.message); return; }
            let out = '';
            stream.on('data', d => out += d.toString());
            stream.stderr.on('data', d => out += d.toString());
            stream.on('close', () => resolve(out));
        });
    });
}
c.on('ready', async () => {
    console.log('Connected\n');

    // Install next-auth with force
    console.log('Installing next-auth on n11 with --legacy-peer-deps...');
    let r = await exec(c, 'cd /www/wwwroot/n11.namainvist.com && npm install next-auth --legacy-peer-deps 2>&1 | tail -5');
    console.log(r.trim());
    
    // Rebuild n11
    console.log('\nRebuilding n11...');
    r = await exec(c, 'cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 && pm2 restart saas-app && echo __OK__');
    if (r.includes('__OK__')) {
        console.log('✅ n11 BUILD OK');
        
        // Wait and test
        await new Promise(r => setTimeout(r, 4000));
        console.log('\n=== API Tests ===');
        
        const apis = [
            ['Login', `curl -s -m 5 -X POST http://localhost:3500/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"O_O772040030"}' 2>&1 | head -c 200`],
            ['Shipments', 'curl -s -m 5 http://localhost:3500/api/shipments 2>&1 | head -c 200'],
            ['Delivery', 'curl -s -m 5 http://localhost:3500/api/delivery-platforms 2>&1 | head -c 200'],
            ['BI Export', 'curl -s -m 5 http://localhost:3500/api/reports/bi-export?entity=inventory 2>&1 | head -c 200'],
            ['Alerts', 'curl -s -m 5 http://localhost:3500/api/contracts/alerts 2>&1 | head -c 200'],
            ['Export', 'curl -s -m 5 -o /dev/null -w "HTTP %{http_code}" http://localhost:3500/api/reports/export?type=trial-balance 2>&1'],
        ];
        for (const [name, cmd] of apis) {
            r = await exec(c, cmd);
            const t = r.trim();
            const ok = t.startsWith('{') || t.startsWith('[') || t.startsWith('HTTP 200');
            console.log(`  ${ok ? '✅' : '❌'} ${name}: ${t.substring(0, 120)}`);
        }
    } else {
        console.log('❌ BUILD FAILED');
        const lines = r.split('\n').filter(l => l.includes('error') || l.includes('Error') || l.includes('not found'));
        lines.forEach(l => console.log('  ', l.trim()));
    }
    
    c.end();
});
c.on('error', e => console.error(e.message));
c.connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:15000});
