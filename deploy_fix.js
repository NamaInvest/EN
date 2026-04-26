const {Client} = require('ssh2');
const c = new Client();
function exec(conn, cmd) { return new Promise((resolve) => { conn.exec(cmd, (err, stream) => { if (err) { resolve('ERROR: ' + err.message); return; } let out = ''; stream.on('data', d => out += d.toString()); stream.stderr.on('data', d => out += d.toString()); stream.on('close', () => resolve(out.trim())); }); }); }
c.on('ready', async () => {
    console.log('🔧 Full Prisma Client regen...\n');

    // Delete old generated client
    let r = await exec(c, 'rm -rf /www/wwwroot/n11.namainvist.com/node_modules/.prisma 2>&1');
    console.log('Deleted .prisma:', r || 'OK');

    // Regenerate
    r = await exec(c, 'cd /www/wwwroot/n11.namainvist.com && npx prisma generate 2>&1');
    console.log('Generate:', r.substring(r.length - 200));

    // Rebuild
    r = await exec(c, 'cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -3');
    console.log('Build:', r);

    // Restart
    await exec(c, 'pm2 restart saas-app');
    console.log('✅ Restarted');
    await new Promise(r => setTimeout(r, 5000));

    // Test
    const HOST = 'brightstartradingco.namainvist.com';
    r = await exec(c, `curl -s -X POST http://localhost:3500/api/auth/login -H 'Host: ${HOST}' -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin7773"}'`);
    const token = JSON.parse(r).token;

    r = await exec(c, `curl -s -X POST http://localhost:3500/api/products -H 'Host: ${HOST}' -H 'Content-Type: application/json' -H 'Authorization: Bearer ${token}' -b 'token=${token}' -d '{"name":"TestRegen","buyPrice":"10","sellPrice":"15","unitId":"1"}'`);
    const pd = JSON.parse(r || '{}');
    console.log('\n🧪 Product:', pd?.id ? '✅ ID: ' + pd.id : '❌ ' + r.substring(0, 150));

    if (!pd?.id) {
        await new Promise(r => setTimeout(r, 500));
        r = await exec(c, 'pm2 logs saas-app --lines 10 --nostream 2>&1');
        console.log('\nError:', r);
    }

    console.log('\n=== DONE ===');
    c.end();
});
c.on('error', e => console.error(e.message));
c.connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:15000});
