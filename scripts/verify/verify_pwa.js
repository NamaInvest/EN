const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

// Actual 1x1 transparent PNG Base64
const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const buffer = Buffer.from(pngBase64, 'base64');

fs.writeFileSync(path.join(__dirname, 'public', 'icon-192x192.png'), buffer);
fs.writeFileSync(path.join(__dirname, 'public', 'icon-512x512.png'), buffer);
console.log("Real PNG icons created in public/");

// Verify SSH Build logs
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cat /www/wwwroot/n1.namainvist.com/npm_install.log && echo "---" && cat /www/wwwroot/n1.namainvist.com/build_api.log | tail -n 25', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
        .on('data', (d) => process.stdout.write(d.toString()))
        .stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD'
});
