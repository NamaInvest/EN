const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Verify what's actually running on N3
    conn.exec('cd /www/wwwroot/n3.namainvist.com && grep -A5 "export function useTranslation" src/lib/i18n.tsx && echo "---" && grep -c "safeT" src/lib/i18n.tsx', (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => { console.log(out); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
