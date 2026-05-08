const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const c = new Client();
function upload(conn, localPath, remotePath) {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) return reject(err);
            sftp.writeFile(remotePath, fs.readFileSync(localPath), (err) => {
                sftp.end();
                if (err) return reject(err);
                resolve();
            });
        });
    });
}
function exec(conn, cmd) {
    return new Promise((resolve) => {
        conn.exec(cmd, (err, stream) => {
            if (err) { resolve('ERROR'); return; }
            let out = '';
            stream.on('data', d => { out += d; process.stdout.write(d); });
            stream.stderr.on('data', d => { out += d; });
            stream.on('close', () => resolve(out));
        });
    });
}
const SITE = '/www/wwwroot/namainvist.com';
const FILES = [
    // Gemini model fix (CRITICAL)
    'src/app/api/ai/copilot/route.ts',
    'src/app/api/ai/fraud-monitoring/route.ts',
    'src/app/api/crm/whatsapp/webhook/route.ts',
    'src/lib/telegram-bot.ts',
    'src/workers/whatsapp.ts',
    // New engines
    'src/lib/rag-pipeline.ts',
    'src/lib/erp-tools.ts',
    'src/lib/ai-cost.ts',
    'src/lib/prompt-registry.ts',
    'src/lib/theme.tsx',
    'src/lib/openapi.ts',
    'src/app/api/docs/openapi.json/route.ts',
    'src/components/ui/states.tsx',
    'middleware.ts',
];
c.on('ready', async () => {
    console.log('🚀 Gemini Fix + Full Phase Deploy\n');
    await exec(c, `mkdir -p ${SITE}/src/app/api/ai/copilot ${SITE}/src/app/api/ai/fraud-monitoring ${SITE}/src/app/api/crm/whatsapp/webhook ${SITE}/src/app/api/docs/openapi.json ${SITE}/src/workers ${SITE}/src/components/ui`);
    for (const f of FILES) {
        const local = path.join(__dirname, f);
        if (fs.existsSync(local)) { await upload(c, local, `${SITE}/${f}`); console.log(`  ✅ ${f}`); }
        else console.log(`  ⏭️ ${f} (not found locally)`);
    }
    console.log('\n🔨 Building...');
    await exec(c, `cd ${SITE} && npm run build 2>&1 | tail -5`);
    console.log('\n🔄 Restarting...');
    await exec(c, 'pm2 restart all --silent && sleep 5 && pm2 list');
    console.log('\n✅ ALL DEPLOYED!');
    c.end();
});
c.on('error', e => console.error('❌', e.message));
c.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
