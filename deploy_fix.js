const {Client} = require('ssh2');
const fs = require('fs');
const path = require('path');
const c = new Client();
function exec(conn, cmd) { return new Promise((resolve) => { conn.exec(cmd, (err, stream) => { if (err) { resolve('ERROR: ' + err.message); return; } let out = ''; stream.on('data', d => out += d.toString()); stream.stderr.on('data', d => out += d.toString()); stream.on('close', () => resolve(out.trim())); }); }); }
function uploadFile(conn, localPath, remotePath) { return new Promise((resolve, reject) => { conn.sftp((err, sftp) => { if (err) return reject(err); sftp.fastPut(localPath, remotePath, (err) => { if (err) return reject(err); resolve(); }); }); }); }

c.on('ready', async () => {
    console.log('🔧 DEFINITIVE FIX: Upload file, verify, clean build, test\n');

    // 1. Upload the FIXED products route
    await uploadFile(c, 'd:\\namasoft9-3-main\\src\\app\\api\\products\\route.ts', '/www/wwwroot/n11.namainvist.com/src/app/api/products/route.ts');
    console.log('✅ Uploaded products/route.ts');

    // 2. Verify the uploaded file has the fix
    let r = await exec(c, 'grep "unit.*connect" /www/wwwroot/n11.namainvist.com/src/app/api/products/route.ts');
    console.log('Verify unit connect:', r || '❌ NOT FOUND');

    if (!r) {
        console.log('\n❌ Upload failed — file not updated!');
        // Let's check what's actually in it
        r = await exec(c, 'grep "unitId\\|categoryId" /www/wwwroot/n11.namainvist.com/src/app/api/products/route.ts | head -5');
        console.log('Current content:', r);
        c.end();
        return;
    }

    // 3. Stop PM2
    await exec(c, 'pm2 stop saas-app');

    // 4. Delete .next
    await exec(c, 'rm -rf /www/wwwroot/n11.namainvist.com/.next');
    console.log('✅ Deleted .next');

    // 5. Build
    r = await exec(c, 'cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -3');
    console.log('Build:', r);

    // 6. Start
    await exec(c, 'pm2 start saas-app');
    await new Promise(r => setTimeout(r, 5000));
    await exec(c, 'pm2 flush saas-app');

    // 7. Test
    const HOST = 'brightstartradingco.namainvist.com';
    r = await exec(c, `curl -s -X POST http://localhost:3500/api/auth/login -H 'Host: ${HOST}' -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin7773"}'`);
    const token = JSON.parse(r).token;
    r = await exec(c, `curl -s -X POST http://localhost:3500/api/products -H 'Host: ${HOST}' -H 'Content-Type: application/json' -H 'Authorization: Bearer ${token}' -b 'token=${token}' -d '{"name":"DefinitiveTest","buyPrice":"10","sellPrice":"15","unitId":"1"}'`);
    const pd = JSON.parse(r || '{}');
    console.log('\n🧪 Product:', pd?.id ? '✅ ID: ' + pd.id : '❌ ' + r.substring(0, 150));

    if (!pd?.id) {
        await new Promise(r => setTimeout(r, 500));
        r = await exec(c, 'pm2 logs saas-app --lines 3 --nostream 2>&1');
        console.log('Error:', r);
    }
    c.end();
});
c.on('error', e => console.error(e.message));
c.connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:15000});
