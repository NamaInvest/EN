// check_build_log.js - check background build progress on any node
const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 };
const nodeName = process.argv[2] || 'n1';
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`echo "=== Build log for ${nodeName} ===" && tail -30 /tmp/build_${nodeName}.log 2>/dev/null || echo "No log yet"`, (err, stream) => {
        stream.on('close', () => conn.end())
            .on('data', d => process.stdout.write(d.toString()))
            .stderr.on('data', d => {});
    });
}).connect(config);
