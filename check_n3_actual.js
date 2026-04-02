const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Check what's actually on N3
    const cmds = [
        'echo "=== ROOT LAYOUT ==="',
        'head -5 /www/wwwroot/n3.namainvist.com/src/app/layout.tsx',
        'grep -n "I18nProvider" /www/wwwroot/n3.namainvist.com/src/app/layout.tsx',
        'echo ""',
        'echo "=== DASHBOARD LAYOUT ==="',
        'head -5 /www/wwwroot/n3.namainvist.com/src/app/\\(dashboard\\)/layout.tsx',
        'grep -n "I18nProvider" /www/wwwroot/n3.namainvist.com/src/app/\\(dashboard\\)/layout.tsx || echo "NO I18nProvider in dashboard layout"',
        'echo ""',
        'echo "=== PM2 STATUS N3 ==="',
        'pm2 show n3 --no-color 2>/dev/null | head -15',
        'echo ""',
        'echo "=== RECENT LOGS N3 ==="',
        'pm2 logs n3 --nostream --lines 10 --no-color 2>/dev/null',
    ].join(' && ');
    
    conn.exec(cmds, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
