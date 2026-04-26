const {Client} = require('ssh2');
const c = new Client();
function exec(conn, cmd) { return new Promise((resolve) => { conn.exec(cmd, (err, stream) => { if (err) { resolve('ERROR: ' + err.message); return; } let out = ''; stream.on('data', d => out += d.toString()); stream.stderr.on('data', d => out += d.toString()); stream.on('close', () => resolve(out.trim())); }); }); }
c.on('ready', async () => {
    console.log('🔧 Regenerating Prisma Client + Rebuilding...\n');

    // 1. Generate Prisma client
    let r = await exec(c, 'cd /www/wwwroot/n11.namainvist.com && npx prisma generate 2>&1 | tail -5');
    console.log('Generate:', r);

    // 2. Rebuild
    r = await exec(c, 'cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -3');
    console.log('Build:', r);

    // 3. Restart
    await exec(c, 'pm2 restart saas-app');
    console.log('✅ Restarted');
    await new Promise(r => setTimeout(r, 5000));

    // 4. Test product creation
    const HOST = 'brightstartradingco.namainvist.com';
    r = await exec(c, `curl -s -m 5 -X POST http://localhost:3500/api/auth/login -H 'Host: ${HOST}' -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin7773"}'`);
    const token = JSON.parse(r).token;
    
    r = await exec(c, `curl -s -m 10 -X POST http://localhost:3500/api/products -H 'Host: ${HOST}' -H 'Content-Type: application/json' -H 'Authorization: Bearer ${token}' -b 'token=${token}' -d '{"name":"Raw Material E2E","nameEn":"Raw Material E2E","buyPrice":"10","sellPrice":"15","unitId":"1","currentStock":"50"}'`);
    const pd = JSON.parse(r || '{}');
    console.log('\n🧪 Product:', pd?.id ? '✅ ID: ' + pd.id : '❌ ' + r.substring(0, 100));

    // Test adjustment
    if (pd?.id) {
        r = await exec(c, `curl -s -m 10 -X POST http://localhost:3500/api/stock/adjustments -H 'Host: ${HOST}' -H 'Content-Type: application/json' -H 'Authorization: Bearer ${token}' -b 'token=${token}' -d '{"productId":${pd.id},"actualQuantity":45,"reason":"test adj"}'`);
        console.log('🧪 Adjustment:', r.substring(0, 120));
    }

    console.log('\n=== DONE ===');
    c.end();
});
c.on('error', e => console.error(e.message));
c.connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:15000});
