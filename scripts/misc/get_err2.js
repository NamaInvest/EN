const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`cd /www/wwwroot/n2.namainvist.com && NODE_ENV=production npx next build 2>&1 | grep -E "Error|error|TypeError|ReferenceError" | grep -v "node_modules" | head -20`, (err, stream) => {
        let data = '';
        stream.on('data', d => data += d);
        stream.stderr.on('data', d => data += d);
        stream.on('close', () => {
            console.log('Build errors:', data || 'none found by grep');
            conn.end();
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD'});
