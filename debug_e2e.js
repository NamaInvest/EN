const {Client} = require('ssh2');
const c = new Client();
function exec(conn, cmd) { return new Promise((resolve) => { conn.exec(cmd, (err, stream) => { if (err) { resolve('ERROR: ' + err.message); return; } let out = ''; stream.on('data', d => out += d.toString()); stream.stderr.on('data', d => out += d.toString()); stream.on('close', () => resolve(out.trim())); }); }); }
c.on('ready', async () => {
    await exec(c, 'pm2 flush saas-app');
    const HOST = 'brightstartradingco.namainvist.com';
    let r = await exec(c, `curl -s -m 5 -X POST http://localhost:3500/api/auth/login -H 'Host: ${HOST}' -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin7773"}'`);
    const token = JSON.parse(r).token;

    // Try creating product
    r = await exec(c, `curl -s -m 10 -X POST http://localhost:3500/api/products -H 'Host: ${HOST}' -H 'Content-Type: application/json' -H 'Authorization: Bearer ${token}' -b 'token=${token}' -d '{"name":"Raw Material E2E","nameEn":"Raw Material E2E","buyPrice":"10","sellPrice":"15","unitId":"1","currentStock":"50"}'`);
    console.log('Product response:', r);
    await new Promise(r => setTimeout(r, 500));
    r = await exec(c, 'pm2 logs saas-app --lines 15 --nostream 2>&1 | grep -i "error\\|product\\|fail\\|unique"');
    console.log('Server errors:', r);

    // Try adjustment
    r = await exec(c, `curl -s -m 10 -X POST http://localhost:3500/api/stock/adjustments -H 'Host: ${HOST}' -H 'Content-Type: application/json' -H 'Authorization: Bearer ${token}' -b 'token=${token}' -d '{"productId":5,"actualQuantity":9,"reason":"test"}'`);
    console.log('\nAdjustment response:', r);

    c.end();
});
c.on('error', e => console.error(e.message));
c.connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:15000});
