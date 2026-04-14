// Usage: node update_gemini_key.js "AIzaSy_YOUR_KEY_HERE"
const { Client } = require('ssh2');

const newKey = process.argv[2];
if (!newKey || !newKey.startsWith('AIza')) {
    console.error('Usage: node update_gemini_key.js "AIzaSy..."');
    process.exit(1);
}

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected...');
    const cmd = `cd /www/wwwroot/n11.namainvist.com && node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.setting.upsert({
    where: { key: 'gemini_api_key' },
    update: { value: '${newKey}' },
    create: { key: 'gemini_api_key', value: '${newKey}' }
}).then(() => { console.log('KEY_UPDATED_OK'); p.\\$disconnect(); })
  .catch(e => { console.error('ERROR:', e.message); p.\\$disconnect(); });
" 2>&1`;

    conn.exec(cmd, (err, stream) => {
        if (err) { conn.end(); return; }
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            console.log('Done! No rebuild needed — reads from DB on each request.');
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170', port: 22,
    username: 'root', password: '_ee4SWbxLVfH9b'
});
