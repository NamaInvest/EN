const {Client} = require('ssh2');
const c = new Client();
function exec(conn, cmd) { return new Promise((resolve) => { conn.exec(cmd, (err, stream) => { if (err) { resolve('ERROR: ' + err.message); return; } let out = ''; stream.on('data', d => out += d.toString()); stream.stderr.on('data', d => out += d.toString()); stream.on('close', () => resolve(out.trim())); }); }); }
c.on('ready', async () => {
    await exec(c, 'pm2 flush saas-app');
    const HOST = 'brightstartradingco.namainvist.com';
    let r = await exec(c, `curl -s -X POST http://localhost:3500/api/auth/login -H 'Host: ${HOST}' -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin7773"}'`);
    const token = JSON.parse(r).token;
    r = await exec(c, `curl -s -X POST http://localhost:3500/api/products -H 'Host: ${HOST}' -H 'Content-Type: application/json' -H 'Authorization: Bearer ${token}' -b 'token=${token}' -d '{"name":"RawTest","buyPrice":"10","sellPrice":"15","unitId":"1"}'`);
    console.log('Product:', r);
    await new Promise(r => setTimeout(r, 500));
    r = await exec(c, 'pm2 logs saas-app --lines 30 --nostream 2>&1');
    console.log('\nFull error:\n', r);

    // Also check DB columns
    r = await exec(c, `PGPASSWORD=n11_pass123 psql -h localhost -U n11_db -d brightstartradingco_db -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='products' ORDER BY ordinal_position;" 2>&1`);
    console.log('\nDB columns:', r);
    c.end();
});
c.on('error', e => console.error(e.message));
c.connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:15000});
