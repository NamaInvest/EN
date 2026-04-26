const {Client} = require('ssh2');
const c = new Client();
function exec(conn, cmd) { return new Promise((resolve) => { conn.exec(cmd, (err, stream) => { if (err) { resolve('ERROR: ' + err.message); return; } let out = ''; stream.on('data', d => out += d.toString()); stream.stderr.on('data', d => out += d.toString()); stream.on('close', () => resolve(out.trim())); }); }); }
c.on('ready', async () => {
    // Flush & test
    await exec(c, 'pm2 flush saas-app');
    const HOST = 'brightstartradingco.namainvist.com';
    let r = await exec(c, `curl -s -X POST http://localhost:3500/api/auth/login -H 'Host: ${HOST}' -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin7773"}'`);
    const token = JSON.parse(r).token;

    // Product that WORKS (from test 1.2) uses unique name
    r = await exec(c, `curl -s -X POST http://localhost:3500/api/products -H 'Host: ${HOST}' -H 'Content-Type: application/json' -H 'Authorization: Bearer ${token}' -b 'token=${token}' -d '{"name":"TestUnique999","buyPrice":"10","sellPrice":"15","unitId":"1","currentStock":"50"}'`);
    console.log('Unique name:', r.substring(0, 100));

    // Product with duplicate name "Raw Material E2E" (already exists)
    r = await exec(c, `curl -s -X POST http://localhost:3500/api/products -H 'Host: ${HOST}' -H 'Content-Type: application/json' -H 'Authorization: Bearer ${token}' -b 'token=${token}' -d '{"name":"Raw Material E2E","buyPrice":"10","sellPrice":"15","unitId":"1","currentStock":"50"}'`);
    console.log('Duplicate name:', r.substring(0, 100));

    await new Promise(r => setTimeout(r, 500));
    r = await exec(c, 'pm2 logs saas-app --lines 20 --nostream 2>&1');
    console.log('\nLogs:', r);

    c.end();
});
c.on('error', e => console.error(e.message));
c.connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:15000});
