const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- TRIGGERING HOST HEADER CRASH ---');
    
    const bashScript = `
#!/bin/bash
curl -I -H "Host: namainvist.com" http://127.0.0.1:2999 > /tmp/curl_res.txt
echo "=== CURL RESULT ==="
cat /tmp/curl_res.txt
echo "=== PM2 ERRORS ==="
pm2 logs nama-main --lines 20 --err --nostream
    `;
    
    conn.exec(bashScript, (execErr, stream) => {
        if (execErr) throw execErr;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
