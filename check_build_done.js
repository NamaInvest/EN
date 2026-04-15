const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 };
const conn = new Client();
conn.on('ready', () => {
    // Check if build process is still running AND check latest BUILD_ID timestamp
    conn.exec(`ps aux | grep "npm run build\\|next build" | grep -v grep | wc -l && echo "---" && cat /www/wwwroot/n11.namainvist.com/.next/BUILD_ID && echo "---BUILD_TS---" && stat -c "%y" /www/wwwroot/n11.namainvist.com/.next/BUILD_ID`, (err, stream) => {
        stream.on('close', () => conn.end())
            .on('data', d => process.stdout.write(d.toString()))
            .stderr.on('data', d => process.stderr.write(d.toString()));
    });
}).connect(config);
