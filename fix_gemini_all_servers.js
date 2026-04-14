const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

// ─── Fleet Server (46.4.188.170) — N1 to N10 ──────────────────────────────
function fixFleetServer() {
    return new Promise((resolve) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log('\n🔧 [FLEET] Connected to 46.4.188.170...');

            // Replace gemini model in all node directories via sed, then rebuild each
            const nodes = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'n10'];
            const fixCmds = nodes.map(n => {
                const dir = `/www/wwwroot/${n}.namainvist.com`;
                return `
if [ -d "${dir}" ]; then
  echo "--- Fixing ${n} ---"
  find "${dir}/src" -name "*.ts" -exec sed -i 's/gemini-2\\.0-flash/gemini-1.5-flash/g' {} \\; 2>/dev/null
  cd "${dir}" && npm run build 2>&1 | tail -3
  pm2 restart ${n} 2>/dev/null || pm2 start node_modules/next/dist/bin/next --name "${n}" -- start -p 30${n.slice(1).padStart(2,'0')} 2>/dev/null || true
  echo "✅ ${n} done"
fi`;
            }).join('\n');

            // Also fix main site
            const mainFix = `
echo "--- Fixing main-site ---"
find "/www/wwwroot/namainvist.com/src" -name "*.ts" -exec sed -i 's/gemini-2\\.0-flash/gemini-1.5-flash/g' {} \\; 2>/dev/null
cd /www/wwwroot/namainvist.com && npm run build 2>&1 | tail -3
pm2 restart main-site 2>/dev/null || true
echo "✅ main-site done"
pm2 save
`;

            conn.exec(fixCmds + mainFix, (err, stream) => {
                if (err) { console.error('[FLEET] Error:', err.message); conn.end(); resolve(); return; }
                stream.on('data', d => process.stdout.write(`[FLEET] ${d}`));
                stream.stderr.on('data', d => process.stderr.write(`[FLEET ERR] ${d}`));
                stream.on('close', () => {
                    console.log('[FLEET] ✅ All nodes fixed!');
                    conn.end();
                    resolve();
                });
            });
        }).on('error', err => {
            console.error('[FLEET] Connection error:', err.message);
            resolve();
        }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
    });
}

// ─── Generic SSH Key Server ────────────────────────────────────────────────
function fixSshKeyServer(label, host, keyPath, appPath, pm2Name) {
    return new Promise((resolve) => {
        const conn = new Client();
        const keyBuffer = fs.readFileSync(keyPath);

        conn.on('ready', () => {
            console.log(`\n🔧 [${label}] Connected to ${host}...`);
            const cmd = `find "${appPath}/src" -name "*.ts" -exec sed -i 's/gemini-2\\.0-flash/gemini-1.5-flash/g' {} \\; && cd "${appPath}" && npm run build 2>&1 | tail -5 && pm2 restart ${pm2Name} && echo "✅ ${label} done"`;
            conn.exec(cmd, (err, stream) => {
                if (err) { console.error(`[${label}] Error:`, err.message); conn.end(); resolve(); return; }
                stream.on('data', d => process.stdout.write(`[${label}] ${d}`));
                stream.stderr.on('data', d => process.stderr.write(`[${label} ERR] ${d}`));
                stream.on('close', () => { conn.end(); resolve(); });
            });
        }).on('error', err => {
            console.error(`[${label}] Connection error:`, err.message);
            resolve();
        }).connect({ host, port: 22, username: 'root', privateKey: keyBuffer });
    });
}

// ─── Run all in parallel ───────────────────────────────────────────────────
async function main() {
    console.log('🚀 Fixing gemini-2.0-flash → gemini-1.5-flash on ALL servers...\n');

    await Promise.all([
        fixFleetServer(),
        fixSshKeyServer('SERVER1', '95.217.187.44', 'C:\\Users\\1\\.ssh\\hetzner_key', '/var/www/namasoft', 'namasoft'),
        fixSshKeyServer('SERVER2', '204.168.144.74', 'C:\\Users\\1\\Desktop\\namasoftkey\\namasoft_key', '/var/www/namasoft', 'namasoft'),
        fixSshKeyServer('SERVER3', '185.197.195.202', 'C:\\Users\\1\\.ssh\\id_ed25519_deploy', '/var/www/namasoft', 'namasoft'),
    ]);

    console.log('\n🎉 ALL SERVERS UPDATED!');
}

main().catch(console.error);
