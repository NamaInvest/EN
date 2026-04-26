const {Client} = require('ssh2');
const fs = require('fs');
const path = require('path');
const c = new Client();
function exec(conn, cmd) { return new Promise((resolve) => { conn.exec(cmd, (err, stream) => { if (err) { resolve('ERROR: ' + err.message); return; } let out = ''; stream.on('data', d => out += d.toString()); stream.stderr.on('data', d => out += d.toString()); stream.on('close', () => resolve(out.trim())); }); }); }
function uploadFile(conn, localPath, remotePath) { return new Promise((resolve, reject) => { conn.sftp((err, sftp) => { if (err) return reject(err); sftp.fastPut(localPath, remotePath, (err) => { if (err) return reject(err); resolve(); }); }); }); }

c.on('ready', async () => {
    console.log('🔧 Upload ALL fixes + Clean build\n');
    const files = [
        'src/app/api/products/route.ts',
        'src/app/api/stock/adjustments/route.ts',
        'src/app/api/manufacturing/orders/route.ts',
        'src/app/(dashboard)/sales/options/page.tsx',
        'src/app/(dashboard)/dashboard/page.tsx',
        'src/app/globals.css',
        'src/app/layout.tsx',
    ];
    for (const f of files) {
        await uploadFile(c, path.join('d:\\namasoft9-3-main', f), `/www/wwwroot/n11.namainvist.com/${f}`);
        console.log(`✅ ${f}`);
    }

    await exec(c, 'pm2 stop saas-app');
    await exec(c, 'rm -rf /www/wwwroot/n11.namainvist.com/.next');
    let r = await exec(c, 'cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -5');
    console.log('Build:', r);
    await exec(c, 'pm2 start saas-app');
    await new Promise(r => setTimeout(r, 5000));
    console.log('\n✅ DEPLOYED — Running E2E...\n');
    c.end();
});
c.on('error', e => console.error(e.message));
c.connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:15000});
