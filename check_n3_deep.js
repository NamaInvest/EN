const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    console.log('Connected! Checking N3 i18n content...\n');
    const cmds = [
        // Check if dashboard keys exist in the deployed i18n.tsx
        'echo "=== dashboard keys in ar section ==="',
        'grep -n "dashboard\\." /www/wwwroot/n3.namainvist.com/src/lib/i18n.tsx | head -20',
        'echo ""',
        'echo "=== common.sar in file ==="',
        'grep -n "common.sar" /www/wwwroot/n3.namainvist.com/src/lib/i18n.tsx',
        'echo ""', 
        'echo "=== default t function ==="',
        'grep -n "t: (key" /www/wwwroot/n3.namainvist.com/src/lib/i18n.tsx',
        'echo ""',
        'echo "=== file line count ==="',
        'wc -l /www/wwwroot/n3.namainvist.com/src/lib/i18n.tsx',
        'echo ""',
        'echo "=== .next BUILD_ID ==="',
        'cat /www/wwwroot/n3.namainvist.com/.next/BUILD_ID 2>/dev/null || echo "NO BUILD_ID"',
        'echo ""',
        'echo "=== check if build is stale ==="',
        'ls -la /www/wwwroot/n3.namainvist.com/.next/BUILD_ID 2>/dev/null',
        'ls -la /www/wwwroot/n3.namainvist.com/src/lib/i18n.tsx',
    ].join(' && ');
    
    conn.exec(cmds, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
