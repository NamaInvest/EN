const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();
conn.on('ready', () => {
    // Save debug results to a file on server then download
    const cmd = `cd /www/wwwroot/n3.namainvist.com && {
echo "TRANSLATIONS_TS_LINES=$(wc -l < src/lib/translations.ts)"
echo "I18N_TSX_LINES=$(wc -l < src/lib/i18n.tsx)"
echo "DASHBOARD_IN_TRANSLATIONS=$(grep -c dashboard.title src/lib/translations.ts)"
echo "TRANSLATE_IN_I18N=$(grep -c translate src/lib/i18n.tsx)"
echo "CHUNKS_WITH_ARABIC=$(grep -rl 'لوحة التحكم' .next/static/chunks/ 2>/dev/null | wc -l)"
echo "CHUNKS_WITH_KEY=$(grep -rl 'dashboard.title' .next/static/chunks/ 2>/dev/null | wc -l)"
echo "CHUNKS_WITH_TRANSLATE_FN=$(grep -rl 'translate' .next/static/chunks/ 2>/dev/null | wc -l)"
echo "SSR_TEST=$(curl -s http://localhost:3003/dashboard 2>/dev/null | grep -c 'dashboard.title')"
echo "SSR_ARABIC=$(curl -s http://localhost:3003/dashboard 2>/dev/null | grep -c 'لوحة التحكم')"
echo "PM2_STATUS=$(pm2 show n3 --no-color 2>/dev/null | grep status | head -1)"
echo "PM2_ERRORS=$(pm2 logs n3 --nostream --lines 3 --err --no-color 2>&1 | tail -3)"
} > /tmp/n3_debug.txt 2>&1
cat /tmp/n3_debug.txt`;
    
    conn.exec(cmd, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => {});
        stream.on('close', () => {
            console.log(out);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
